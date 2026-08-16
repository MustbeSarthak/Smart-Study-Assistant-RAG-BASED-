import os
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_mistralai import ChatMistralAI
from langchain_community.document_loaders import (DirectoryLoader, PyPDFLoader)
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from src.splitters.text_splitter import split_documents
from src.embeddings.embeddings_model import get_embedding_model


load_dotenv()

# ==================================================
# APP
# ==================================================

app = FastAPI(title="Smart Study Assistant")


app.add_middleware( CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],)


# ==================================================
# DIRECTORIES
# ==================================================

DATA_DIR = "data"
USERS_DIR = os.path.join(DATA_DIR, "users")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(USERS_DIR, exist_ok=True)


# ==================================================
# EMBEDDING MODEL
# ==================================================

embeddings = get_embedding_model()


# ==================================================
# AI MODEL
# ==================================================

model = ChatMistralAI(
    model="mistral-small-2506",
    temperature=0.4,
    max_tokens=300
)


# ==================================================
# PROMPT
# ==================================================

prompt_temp = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are a Smart Study Assistant powered by a RAG system.

Answer the user's question using ONLY the provided context.

If the answer is not present in the context, clearly say that
the provided study material does not contain enough information.

Explain concepts clearly and use examples whenever useful.

Context:
{context}
"""
    ),
    (
        "human",
        "{question}"
    )
])


# ==================================================
# REQUEST MODEL
# ==================================================

class QuestionRequest(BaseModel):
    question: str
    user_id: str


# ==================================================
# GLOBAL VECTOR STORE
# ==================================================

global_vectorstore = None


def initialize_global_vectorstore():

    global global_vectorstore

    pdf_files = []

    for root, dirs, files in os.walk(DATA_DIR):

        # Don't scan users folder as global data
        if os.path.abspath(root).startswith(
            os.path.abspath(USERS_DIR)
        ):
            continue

        for file in files:
            if file.lower().endswith(".pdf"):
                pdf_files.append(
                    os.path.join(root, file)
                )

    if not pdf_files:
        print("No default PDFs found in data/")
        return

    documents = []

    for pdf in pdf_files:

        loader = PyPDFLoader(pdf)

        docs = loader.load()

        documents.extend(docs)

    print(f"Default Documents: {len(documents)}")

    chunks = split_documents(documents)

    print(f"Default Chunks: {len(chunks)}")

    global_vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="./chroma_db"
    )

    print("Global vector store initialized.")


# ==================================================
# USER VECTOR STORE
# ==================================================

def get_user_vectorstore(user_id):

    user_chroma_dir = os.path.join(
        USERS_DIR,
        user_id,
        "chroma_db"
    )

    if not os.path.exists(user_chroma_dir):
        return None

    try:

        vectorstore = Chroma(
            persist_directory=user_chroma_dir,
            embedding_function=embeddings
        )

        return vectorstore

    except Exception:

        return None


# ==================================================
# INITIALIZE DEFAULT DATA
# ==================================================

initialize_global_vectorstore()


# ==================================================
# UPLOAD SYLLABUS
# ==================================================

@app.post("/upload")
async def upload_syllabus(
    user_id: str,
    files: list[UploadFile] = File(...)
):

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required."
        )

    user_dir = os.path.join(
        USERS_DIR,
        user_id
    )

    syllabus_dir = os.path.join(
        user_dir,
        "syllabus"
    )

    chroma_dir = os.path.join(
        user_dir,
        "chroma_db"
    )

    os.makedirs(syllabus_dir, exist_ok=True)
    os.makedirs(chroma_dir, exist_ok=True)

    uploaded_files = []

    for file in files:

        if not file.filename.lower().endswith(".pdf"):
            continue

        # Prevent weird filenames
        safe_filename = os.path.basename(
            file.filename
        )

        file_path = os.path.join(
            syllabus_dir,
            safe_filename
        )

        content = await file.read()

        with open(file_path, "wb") as f:
            f.write(content)

        uploaded_files.append(safe_filename)

    if not uploaded_files:

        raise HTTPException(
            status_code=400,
            detail="Please upload PDF files only."
        )

    # ----------------------------------------------
    # Load uploaded PDFs
    # ----------------------------------------------

    documents = []

    for filename in uploaded_files:

        file_path = os.path.join(
            syllabus_dir,
            filename
        )

        loader = PyPDFLoader(file_path)

        docs = loader.load()

        documents.extend(docs)

    # ----------------------------------------------
    # Split
    # ----------------------------------------------

    chunks = split_documents(documents)

    # ----------------------------------------------
    # Create / Update User Vector Store
    # ----------------------------------------------

    vectorstore = Chroma(
        persist_directory=chroma_dir,
        embedding_function=embeddings
    )

    vectorstore.add_documents(chunks)

    return {
        "message": "Syllabus uploaded successfully.",
        "files": uploaded_files,
        "chunks": len(chunks)
    }


# ==================================================
# ASK QUESTION
# ==================================================

@app.post("/ask")
async def ask_question(request: QuestionRequest):

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    # ----------------------------------------------
    # Retrieve from global documents
    # ----------------------------------------------

    relevant_docs = []

    if global_vectorstore:

        global_retriever = global_vectorstore.as_retriever(
            search_kwargs={"k": 4}
        )

        global_docs = global_retriever.invoke(
            question
        )

        relevant_docs.extend(global_docs)

    # ----------------------------------------------
    # Retrieve from user's documents
    # ----------------------------------------------

    user_vectorstore = get_user_vectorstore(
        request.user_id
    )

    if user_vectorstore:

        user_retriever = user_vectorstore.as_retriever(
            search_kwargs={"k": 4}
        )

        user_docs = user_retriever.invoke(
            question
        )

        relevant_docs.extend(user_docs)

    # ----------------------------------------------
    # No documents
    # ----------------------------------------------

    if not relevant_docs:

        return {
            "answer": (
                "No study material is available yet. "
                "Please upload your syllabus PDF first."
            ),
            "sources": []
        }

    # ----------------------------------------------
    # Context
    # ----------------------------------------------

    context = "\n\n".join(
        doc.page_content
        for doc in relevant_docs
    )

    # ----------------------------------------------
    # LLM
    # ----------------------------------------------

    messages = prompt_temp.invoke({
        "context": context,
        "question": question
    })

    response = model.invoke(messages)

    # ----------------------------------------------
    # Sources
    # ----------------------------------------------

    sources = []

    for doc in relevant_docs:

        source = doc.metadata.get(
            "source",
            "Unknown"
        )

        page = doc.metadata.get(
            "page",
            None
        )

        sources.append({
            "file": os.path.basename(source),
            "page": (
                page + 1
                if isinstance(page, int)
                else None
            )
        })

    # Remove duplicate sources
    unique_sources = []

    for source in sources:

        if source not in unique_sources:
            unique_sources.append(source)

    return {
        "answer": response.content,
        "sources": unique_sources
    }


# ==================================================
# FRONTEND
# ==================================================

app.mount(
    "/static",
    StaticFiles(directory="frontend"),
    name="static"
)


@app.get("/")
async def home():

    return FileResponse(
        "frontend/index.html"
    )