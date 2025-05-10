from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import FileResponse
import uuid, os

app = FastAPI()

@app.post("/generate-sound")
async def generate_sound(prompt: str = Form(...), audio: UploadFile = File(None)):
    # Save uploaded audio (or fallback to default sample)
    os.makedirs("temp", exist_ok=True)
    os.makedirs("output", exist_ok=True)

    input_path = "default.wav"
    if audio:
        input_path = f"temp/{uuid.uuid4()}.wav"
        with open(input_path, "wb") as f:
            f.write(await audio.read())

    # Simulate AI audio processing using ffmpeg (you can replace this with DDSP/RAVE later)
    output_path = f"output/{uuid.uuid4()}.wav"
    os.system(f"ffmpeg -i {input_path} -af \"aecho=0.8:0.9:1000:0.3\" {output_path}")

    return FileResponse(output_path, media_type="audio/wav", filename="ai-sample.wav")
