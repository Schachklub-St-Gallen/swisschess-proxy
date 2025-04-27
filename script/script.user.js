// ==UserScript==
// @name        Swisschess with Elo (SMM only)
// @author      Mr. Perseus
// @namespace   perseus-chess
// @description Adds links to Swisschess sites for Results upload.
// @match       https://adapter.swisschess.ch/ssb-external*
// @require     http://code.jquery.com/jquery-3.6.0.min.js
// @version     0.1.1
// @grant       none
// ==/UserScript==

(function (fn) {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/javascript');
    script.textContent = `(${fn})();`;
    document.body.appendChild(script);
    document.body.removeChild(script);
})(() => {
    const getLink = (code) => {
        const originalString = "/schachsport/fl/detail.php?code=" + code;
        const encodedString = window.btoa(originalString);
        console.log(encodedString);

        return "https://www.swisschess.ch/fuehrungsliste-detail.html?old=" + encodedString;
    }

    const addSmmCodes = () => {
        $('table.smm_result > tbody > tr > td:nth-child(2)').each((a, b) => {
            if (!isNaN(b.innerText)) {
                b.innerHTML = `<a href="${getLink(b.innerText)}" target="_blank">${b.innerHTML}</a>`;
            }
        })
        $('table.smm_result > tbody > tr > td:nth-child(5)').each((a, b) => {
            if (!isNaN(b.innerText)) {
                b.innerHTML = `<a href="${getLink(b.innerText)}" target="_blank">${b.innerHTML}</a>`;
            }
        })
    }

    $(document).ready(() => {
        try {
            addSmmCodes();
        } catch (err) {
            console.error('ERROR', err);
        }
    });
});
