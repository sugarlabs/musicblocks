from fastapi import FastAPI, Request
from transformers import pipeline

app = FastAPI()

qa_pipeline = pipeline("text-generation", model="sshleifer/tiny-gpt2")

@app.post("/query")
async def ask_bot(request: Request):
    data = await request.json()
    question = data.get("question", "")
    prompt = f"Answer this Music Blocks question:\n{question}\nAnswer:"
    response = qa_pipeline(prompt, max_length=300)
    return {"response": response[0]['generated_text']}

