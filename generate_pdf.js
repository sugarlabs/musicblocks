const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
    try {
        const args = process.argv.slice(2);
        let lang = (args[0] || "en").toLowerCase(); // Default to English and normalize case

        // Map common aliases to supported language keys
        const aliases = {
            "zh-cn": "zh",
            "zhcn": "zh",
            "ja-jp": "ja",
            "jajp": "ja"
        };

        if (aliases[lang]) {
            lang = aliases[lang];
        }

        const langMap = {
            en: {
                dir: "guide",
                file: "MusicBlocks_Guide.pdf",
                title: "Music Blocks Programming Guide"
            },
            es: {
                dir: "guide-es",
                file: "MusicBlocks_Guide_ES.pdf",
                title: "Guía de Programación con Bloques de Música"
            },
            zh: {
                dir: "guide-zhCN",
                file: "MusicBlocks_Guide_ZH.pdf",
                title: "《音乐拼块》程序设计说明"
            },
            pt: {
                dir: "guide-pt",
                file: "MusicBlocks_Guide_PT.pdf",
                title: "Guia de Programação com Music Blocks"
            },
            ja: {
                dir: "guide-ja",
                file: "MusicBlocks_Guide_JA.pdf",
                title: "ミュージック・ブロックスのプログラミング案内"
            }
        };

        if (!langMap[lang]) {
            console.error(
                `Unsupported language: ${lang}. Supported: ${Object.keys(langMap).join(", ")}`
            );
            process.exit(1);
        }

        const config = langMap[lang];
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        const guideUrl = `file:///${path.join(__dirname, "Docs", config.dir, "index.html").replace(/\\/g, "/")}`;

        console.log(`Navigating to ${guideUrl}...`);
        await page.goto(guideUrl, { waitUntil: "networkidle0" });

        // Inject custom CSS for printing
        await page.addStyleTag({
            content: `
            @media print {
                .top-nav, .download-btn, .language-switcher {
                    display: none !important;
                }
                
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
                    font-size: 12pt !important;
                    line-height: 1.5 !important;
                    color: #000 !important;
                    background: #fff !important;
                }
                
                .jumbotron {
                    background-color: transparent !important;
                    color: #000 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border-bottom: 2px solid #333 !important;
                    border-radius: 0 !important;
                    margin-bottom: 30px !important;
                }
                
                .content-wrapper {
                    padding: 0 !important;
                    box-shadow: none !important;
                }
                
                h1, h2, h3, h4, h5, h6 {
                    color: #000 !important;
                    page-break-after: avoid !important;
                    page-break-inside: avoid !important;
                }
                
                h1 {
                    font-size: 24pt !important;
                    margin-top: 0 !important;
                }
                
                h2 {
                    font-size: 18pt !important;
                    margin-top: 2em !important;
                    border-bottom: 1px solid #ccc !important;
                    padding-bottom: 5px !important;
                }
                
                img, svg {
                    max-width: 100% !important;
                    height: auto !important;
                    page-break-inside: avoid !important;
                    margin: 15px auto !important;
                    display: block !important;
                }
                
                a {
                    color: #000 !important;
                    text-decoration: underline !important;
                }
            }
            `
        });

        const pdfPath = path.join(__dirname, "Docs", config.dir, config.file);
        console.log(`Saving PDF to ${pdfPath}...`);

        await page.pdf({
            path: pdfPath,
            format: "A4",
            printBackground: true,
            margin: { top: "25mm", right: "20mm", bottom: "25mm", left: "20mm" },
            displayHeaderFooter: true,
            headerTemplate: "<div></div>",
            footerTemplate: `<div style="font-size: 10px; text-align: center; width: 100%; border-top: 1px solid #ccc; padding-top: 5px;">${config.title} - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`
        });

        console.log(`PDF for ${lang} generated successfully!`);
        await browser.close();
    } catch (error) {
        console.error("Error generating PDF:", error);
        process.exit(1);
    }
})();
