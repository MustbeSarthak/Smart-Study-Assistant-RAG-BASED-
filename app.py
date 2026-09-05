from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_chroma import Chroma
from src.splitters.text_splitter import split_documents
from src.embeddings.embeddings_model import get_embedding_model
from langchain_core.prompts import ChatPromptTemplate
load_dotenv()

# PDF Loader
loader = DirectoryLoader(
    "data/",
    glob="**/*.pdf",
    loader_cls=PyPDFLoader
)


# Load Documents
docs = loader.load()

print(f"Documents: {len(docs)}")


# Split Documents
chunks = split_documents(docs)

print(f"Chunks: {len(chunks)}")


# Embedding Model
embeddings = get_embedding_model()


# AI Model
model = ChatMistralAI(
    model="mistral-small-2506",
    temperature=0.4,
    max_tokens=300
)


# Vector Store
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)


# Retriever
retriever = vectorstore.as_retriever(
    search_kwargs={"k": 4}
)


# System Behavior
prompt_temp = ChatPromptTemplate.from_messages([("system",
"""You are a Smart Study Assistant powered by a RAG system.

Answer the user's question using ONLY the provided context.

If the answer is not present in the context, clearly say that the provided study material does not contain enough information.

Explain concepts clearly and use examples whenever useful.

Context:
{context}"""
    ),
    (
        "human",
        "{question}"
    )
])


# User Question
prompt = input("Ask your question: ")


# Retrieve Relevant Documents
relevant_docs = retriever.invoke(prompt)

print("\n--- Retrieved Context ---\n")

for doc in relevant_docs:
    print(doc.page_content)
    print("\n------------------------\n")