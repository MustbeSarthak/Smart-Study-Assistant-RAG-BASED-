from langchain_core.documents import Document

# Ṛecursive Text Splitter
def split_documents(
    documents: list[Document],
    chunk_size: int = 500
) -> list[Document]:

    separators = ["\n\n", "\n", " ", ""]

    chunks = []

    for doc in documents:

        text = doc.page_content

        def split_text(text, separators):

            # Base case
            if len(text) <= chunk_size:
                return [text]

            # Try separators one by one
            for separator in separators:

                if separator == "":
                    parts = list(text)
                else:
                    parts = text.split(separator)

                # If separator actually split the text
                if len(parts) > 1:

                    result = []

                    for part in parts:

                        if len(part) <= chunk_size:
                            result.append(part)

                        else:
                            result.extend(
                                split_text(
                                    part,
                                    separators[separators.index(separator) + 1:]
                                )
                            )

                    return result

            return [text]

        text_chunks = split_text(text, separators)

        for chunk in text_chunks:

            if chunk.strip():

                chunks.append(
                    Document(
                        page_content=chunk.strip(),
                        metadata=doc.metadata.copy()
                    )
                )
    return chunks


# Normal Text Splitter
def text_splitter(
    documents: list[Document],
    chunk_size: int = 1000
) -> list[Document]:

    chunks = []

    for doc in documents:
        text = doc.page_content

        parts = text.split("\n\n")

        for part in parts:
            if len(part) <= chunk_size and part.strip():
                chunks.append(
                    Document(
                        page_content=part.strip(),
                        metadata=doc.metadata.copy()
                    )
                )

    return chunks

            

            
