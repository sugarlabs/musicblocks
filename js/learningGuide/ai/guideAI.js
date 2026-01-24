const GuideAI = {
    async ask({ stepId, stepText, userQuestion }) {
        try {
            const isCompleted = GuideValidator.check(
                GuideSteps.find(s => s.id === stepId)
            );

            const res = await fetch("/guide-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stepId,
                    stepText,
                    isCompleted,
                    userQuestion
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            return data.response || "AI unavailable.";

        } catch (err) {
            console.error("❌ GuideAI frontend error:", err);
            return "AI is temporarily unavailable. Please try again.";
        }
    }
};

window.GuideAI = GuideAI;