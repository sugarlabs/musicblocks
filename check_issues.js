const fetchIssues = async () => {
    let allIssues = [];
    for (let i = 1; i <= 3; i++) {
        const res = await fetch(
            `https://api.github.com/repos/sugarlabs/musicblocks/issues?state=open&per_page=100&page=${i}`
        );
        const data = await res.json();
        allIssues = allIssues.concat(data);
        if (data.length < 100) break;
    }
    const matches = allIssues.filter(i => {
        const text = (i.title + " " + (i.body || "")).toLowerCase();
        return (
            !i.pull_request &&
            (text.includes("reflection") || text.includes("debugger")) &&
            (text.includes("concurrency") ||
                text.includes("race") ||
                text.includes("destroy") ||
                text.includes("unmount") ||
                text.includes("leak") ||
                text.includes("duplicate"))
        );
    });
    console.log("Matched Open Issues:");
    matches.forEach(i => console.log(`#${i.number}: ${i.title}`));
};
fetchIssues();
