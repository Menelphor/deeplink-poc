// This file contains JavaScript code for the Hello World website.

// // Rewrite rule: Remove /applink prefix from the path if present
// function handleApplinkRewrite() {
//     const path = window.location.pathname;
//     if (path.startsWith('/applink')) {
//         const newPath = path.replace(/^\/applink/, '') || '/';
//         const newUrl = newPath + window.location.search + window.location.hash;
//         window.location.replace(newUrl);
//     }
// }

handleApplinkRewrite();

document.addEventListener('DOMContentLoaded', () => {
    const messageElement = document.createElement('h1');
    messageElement.textContent = 'Hello, World!';
    document.body.appendChild(messageElement);
});