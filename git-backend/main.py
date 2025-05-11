from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from git import Repo
from pathlib import Path

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REPO_DIR = Path("repo")

@app.post("/commit")
async def commit_file(file: UploadFile, message: str = Form(...)):
    REPO_DIR.mkdir(exist_ok=True)
    file_path = REPO_DIR / file.filename
    with open(file_path, "wb") as f:
        f.write(await file.read())
    repo = Repo.init(REPO_DIR) if not (REPO_DIR / ".git").exists() else Repo(REPO_DIR)
    repo.index.add([str(file_path)])
    repo.index.commit(message)
    return {"status": "success", "message": f"Committed: {file.filename}"}

@app.get("/log")
def git_log():
    repo = Repo(REPO_DIR)
    return {
        "commits": [
            {
                "hash": c.hexsha,
                "author": c.author.name,
                "message": c.message.strip(),
                "date": c.committed_datetime.isoformat(),
            }
            for c in repo.iter_commits()
        ]
    }
