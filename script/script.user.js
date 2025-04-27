// ==UserScript==
// @name        Swisschess with Elo (SMM only)
// @author      Mr. Perseus
// @namespace   perseus-chess
// @description Adds links to Swisschess sites for Results upload.
// @match       https://adapter.swisschess.ch/ssb-external*
// @require     http://code.jquery.com/jquery-3.6.0.min.js
// @version     0.2.0
// @grant       none
// ==/UserScript==

(function (fn) {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/javascript');
    script.textContent = `(${fn})();`;
    document.body.appendChild(script);
    document.body.removeChild(script);
})(() => {
    const swisschessProxyBaseUrl = "http://localhost:8080";
    const swisschessBaseUrl = "https://www.swisschess.ch";

    const getLink = (code) => {
        const originalString = "/schachsport/fl/detail.php?code=" + code;
        const encodedString = window.btoa(originalString);

        return `${swisschessBaseUrl}/fuehrungsliste-detail.html?old=${encodedString}`;
    }

    const linkCodeAndAddElo = (htmlElement) => {
        if (!isNaN(htmlElement.innerText)) {
            htmlElement.innerHTML = `<a href="${getLink(htmlElement.innerText)}" target="_blank">${htmlElement.innerHTML}</a>`;
        }
        const nextCell = htmlElement.nextElementSibling;
        if (nextCell) {
            $.get(`${swisschessProxyBaseUrl}/player?id=${htmlElement.innerText}`, function (data) {
                if (data && data.elo) {
                    nextCell.innerHTML += ` (${data.elo})`;
                }
            });
        }
    }

    const addSmmCodes = () => {
        $('table.smm_result > tbody > tr > td:nth-child(2)').each((a, b) => {
            linkCodeAndAddElo(b);
        })
        $('table.smm_result > tbody > tr > td:nth-child(5)').each((a, b) => {
            linkCodeAndAddElo(b);
        })
    }

    const tableToMarkdown = () => {
        const table = document.querySelectorAll('table.smm_result')?.[0];
        if (!table) {
            console.error('Table not found');
            return '';
        }

        const columnsToConsider = [0, 2, 5, 7]; // Only use relevant columns
        let md = '';
        const rows = Array.from(table.querySelectorAll('tr'));

        rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            const cellTexts = cells
                .filter((cell, index) => {
                    return columnsToConsider.includes(index);
                })
                .map((cell) => {
                    let text = cell.innerText.trim();
                    text = text.replace(/[\r\n]+/g, ' '); // remove line breaks inside text
                    text = text.replace(/\|/g, '\\|'); // escape any pipe characters
                    return text;
                });
            md += `| ${cellTexts.join(' | ')} |\n`;

            if (rowIndex === 0) {
                md += `| ${cellTexts.map(() => '---').join(' | ')} |\n`;
            }
        });

        return md;
    }

    const replaceHomeAwayTeamHeader = (md, homeTeam, awayTeam) => {
        let count = 0;
        return md.replace(/Spieler Joueur/g, (match) => {
            count++;
            if (count === 1) {
                return homeTeam;
            } else if (count === 2) {
                return awayTeam;
            } else {
                return match; // leave other matches unchanged
            }
        });
    }

    const replaceScore = (md) => {
        const scoreRegex = /(Resultat\s*)?(\d+(?:\.5)?)[\s\-–]+(\d+(?:\.5)?)(\s*Résultat)?/;

        let originalScore = ""

        const updatedMd = md.replace(scoreRegex, (match, _r1, home, away, _r2) => {
            const scoreString = `${home} - ${away}`;

            originalScore = scoreString;

            // Convert .5 to ½
            const halfify = (score) => score.replace('.5', '½');

            return `${halfify(home)}-${halfify(away)}`; // Replace only the matched part
        });

        return {mdWithReplacedScore: updatedMd, originalScore};
    }

    const buildTitle = (homeTeam, awayTeam, result) => {
        return `### ${homeTeam} - ${awayTeam} (${result}) \n\n`;
    }

    const printNiceMarkdown = () => {
        let tableMarkdown = tableToMarkdown();

        let homeTeam = $('table.smm_teams > tbody > tr > td:nth-child(2)')?.text();
        let awayTeam = $('table.smm_teams > tbody > tr > td:nth-child(4)')?.text();

        const {mdWithReplacedScore, originalScore} = replaceScore(tableMarkdown);

        tableMarkdown = mdWithReplacedScore;

        if (homeTeam && awayTeam) {
            homeTeam = homeTeam.replace(/^Heimmannschaft:\s*/, '');
            awayTeam = awayTeam.replace(/^Gastmannschaft:\s*/, '');

            tableMarkdown = replaceHomeAwayTeamHeader(tableMarkdown, homeTeam, awayTeam);

            tableMarkdown = buildTitle(homeTeam, awayTeam, originalScore) + tableMarkdown;
        }

        console.log(tableMarkdown);
    }

    $(document).ready(() => {
        try {
            addSmmCodes();

            // TODO Promises
            setTimeout(() => {
                printNiceMarkdown();
            }, 2000);

        } catch (err) {
            console.error('ERROR', err);
        }
    });
});
