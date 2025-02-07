// 获取当前页面的查询字符串
const behindQ = window.location.search;
console.log('behindQ=' + behindQ);

// 从查询字符串中提取文件名
const fileName = behindQ.slice(1);
console.log("fileName=" + fileName);

// 构建 Markdown 文件的路径
const filePath = 'markdownfile/' + fileName;
console.log("filePath=" + filePath);

document.getElementById("title").innerText = fileName;

const _error_message = `
    <div class="error-message">
        <img src="https://wyc-w.top/index/footage/1.png" style="left: 10px; top: 10px; position: absolute;">
        <h1 style="font-size: 50px;">Error 114514-1</h1>
        <p style="font-size: 25px; font-weight: bold;">文件不存在</p>
        <a href="https://wyc-w.top" style="color: black; text-decoration: none; font-weight: bold;">返回首页</a>
    </div>
`;

document.getElementById("sidebar").style.display = "none";
document.getElementById("hidefileListButton").style.display = "none";
document.getElementById("fileListButton").addEventListener("click", function () {
    document.getElementById("sidebar").style.display = "block";
    document.getElementById("hidefileListButton").style.display = "block";
    document.getElementById("fileListButton").style.display = "none";

})
document.getElementById("hidefileListButton").addEventListener("click", function () {
    document.getElementById("sidebar").style.display = "none";
    document.getElementById("hidefileListButton").style.display = "none";
    document.getElementById("fileListButton").style.display = "block";

})

document.getElementById("changecolor").addEventListener("click", function () {
    const colorElement = document.getElementById("color");
    const currentColor = colorElement.href.split('/').pop();
    if (currentColor === "blue.css") {
        colorElement.href = "./red.css";
        localStorage.setItem("currentColor", "red.css");
    } else if (currentColor === "red.css") {
        colorElement.href = "./green.css";
        localStorage.setItem("currentColor", "green.css");
    } else if (currentColor === "green.css") {
        colorElement.href = "./blue.css";
        localStorage.setItem("currentColor", "blue.css");
    }
});

// 页面加载时应用用户选择的颜色
window.onload = function () {
    const savedColor = localStorage.getItem("currentColor");
    if (savedColor) {
        document.getElementById("color").href = `./${savedColor}`;
    }
};

// 从本地文件加载 JSON 数据
fetch('markdownfile/files.json') // 确保文件路径正确
    .then(response => {
        // 检查响应是否成功
        if (!response.ok) {
            throw new Error('文件加载失败');
        }
        // 将响应解析为 JSON
        return response.json();
    })
    .then(data => {
        console.log("从本地文件加载的 JSON 数据:", data);
        loadFileList(data);
        // 检查文件名是否存在于 JSON 数据中
        const containsVariable = data.includes(fileName); // 假设 data 是一个数组
        if (containsVariable) {
            console.log('文件存在');
            // 确保 KaTeX 加载完成后才调用 renderMathInElement
            window.addEventListener('load', function () {
                console.log('KaTeX加载完成');
                // 加载并渲染 Markdown 文件
                loadMarkdown(filePath, 'markdownContent');
            });
        } else {
            console.log('文件不存在');
            // 在页面中显示错误信息
            document.getElementById('markdownContent').innerHTML = _error_message;
        }
    })
    .catch(error => {
        // 捕获并处理加载文件时的错误
        console.error('加载文件时出错:', error);
        // 在页面中显示错误信息
        document.getElementById('markdownContent').innerText = 'error 114514-2';
    });

function loadFileList(files) {
    // 获取当前页面的基本 URL（不包括查询字符串）
    const baseUrl = window.location.origin + window.location.pathname;

    // 构建文件列表的 HTML 内容
    let fileListHtml = '<ul>';
    files.forEach(file => {
        // 构建新的链接 URL
        const newUrl = `${baseUrl}?${encodeURIComponent(file)}`;
        fileListHtml += `<li><a href="${newUrl}">${file}</a></li>`;
    });
    fileListHtml += '</ul>';

    // 将文件列表插入到页面中
    document.getElementById('sidebarContent').innerHTML = fileListHtml;
}

/**
 * 加载并渲染 Markdown 文件到指定的 HTML 元素中
 * @param {string} url - Markdown 文件的 URL
 * @param {string} elementId - 目标 HTML 元素的 ID
 */
function loadMarkdown(url, elementId) {
    // 使用 fetch API 获取 Markdown 文件内容
    fetch(url)
        .then(response => response.text()) // 将响应转换为文本
        .then(markdownText => {
            // 使用 marked.js 库解析 Markdown 文本为 HTML
            const htmlContent = marked.parse(markdownText);
            // 将解析后的 HTML 内容插入到页面中指定的元素
            document.getElementById(elementId).innerHTML = htmlContent;
            // 使用 KaTeX 库渲染 HTML 中的数学公式
            renderMathInElement(document.getElementById(elementId), {
                // 定义数学公式的分隔符
                delimiters: [
                    { left: "$$", right: "$$", display: true }, // 双美元符号表示显示模式的公式
                    { left: "$", right: "$", display: false } // 单美元符号表示内联模式的公式
                ]
            });
        })
        .catch(error => {
            // 捕获并处理加载 Markdown 文件时的错误
            console.error('加载 Markdown 文件时出错：', error);
            // 在目标元素中显示错误信息
            document.getElementById(elementId).innerText = 'error 114514-3';
        });
}