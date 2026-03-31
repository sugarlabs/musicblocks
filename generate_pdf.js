const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        const guideUrl = 'file:///c:/Users/govin/OneDrive/Desktop/Open%20Source/musicblocks/Docs/guide/index.html';
        
        console.log(`Navigating to ${guideUrl}...`);
        await page.goto(guideUrl, { waitUntil: 'networkidle0' });

        // Inject custom CSS for printing
        await page.addStyleTag({
            content: `
            @media print {
                /* Hide web-only elements */
                .top-nav, .download-btn, p > a[href*="index.html"] {
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
                
                h3 {
                    font-size: 14pt !important;
                    margin-top: 1.5em !important;
                }
                
                p, li {
                    orphans: 3 !important;
                    widows: 3 !important;
                }
                
                img, svg {
                    max-width: 100% !important;
                    height: auto !important;
                    page-break-inside: avoid !important;
                    margin: 15px auto !important;
                    display: block !important;
                }
                
                table {
                    page-break-inside: auto !important;
                    width: 100% !important;
                    border-collapse: collapse !important;
                }
                
                tr {
                    page-break-inside: avoid !important;
                    page-break-after: auto !important;
                }
                
                th, td {
                    border: 1px solid #ddd !important;
                    padding: 8px !important;
                }
                
                th {
                    background-color: #f5f5f5 !important;
                    font-weight: bold !important;
                }
                
                a {
                    color: #000 !important;
                    text-decoration: underline !important;
                }
            }
            `
        });
        
        const pdfPath = path.join('c:', 'Users', 'govin', 'OneDrive', 'Desktop', 'Open Source', 'musicblocks', 'Docs', 'guide', 'MusicBlocks_Guide.pdf');
        console.log(`Saving PDF to ${pdfPath}...`);
        
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; border-top: 1px solid #ccc; padding-top: 5px;">Music Blocks Programming Guide - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
        });

        console.log('PDF generated successfully!');
        await browser.close();
    } catch (error) {
        console.error('Error generating PDF:', error);
        process.exit(1);
    }
})();
