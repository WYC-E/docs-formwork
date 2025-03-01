// index.js 完整代码（已修复远程文件校验问题）
// 获取URL参数并解码
const urlParams = new URLSearchParams(window.location.search);
const filePathParam = urlParams.get('path') || '';
console.log('原始路径参数:', filePathParam);

// 安全过滤路径参数（防止目录遍历）【优化点：仅过滤本地路径】
const safeFilePath = filePathParam
  .replace(/(\.\.\/)|(\\\.\.)/g, '') 
  .replace(/\/\//g, '/');

// 判断是否为远程文件
const isRemoteFile = safeFilePath.startsWith('http');
const finalPath = isRemoteFile ? safeFilePath : `markdownfile/${safeFilePath}`;
console.log('最终文件路径:', finalPath);

document.getElementById("title").innerText = 
  safeFilePath.split('/').pop() || '未知文件';

const _error_message = `
  <div class="error-message">
    <img src="https://wyc-w.top/index/footage/1.png" 
         style="left: 10px; top: 10px; position: absolute;">
    <h1 style="font-size: 50px;">Error 114514-1</h1>
    <p style="font-size: 25px; font-weight: bold;">文件不存在</p>
    <a href="https://wyc-w.top" 
       style="color: black; text-decoration: none; font-weight: bold;">
       返回首页
    </a>
  </div>
`;

// [侧边栏控制逻辑保持不变...]
document.getElementById("sidebar").style.display = "none";
document.getElementById("hidefileListButton").style.display = "none";

document.getElementById("fileListButton").addEventListener("click", function () {
  document.getElementById("sidebar").style.display = "block";
  document.getElementById("hidefileListButton").style.display = "block";
  this.style.display = "none";
});

document.getElementById("hidefileListButton").addEventListener("click", function () {
  document.getElementById("sidebar").style.display = "none";
  document.getElementById("fileListButton").style.display = "block";
  this.style.display = "none";
});

// [颜色切换逻辑保持不变...]
document.getElementById("changecolor").addEventListener("click", function () {
  const colorElement = document.getElementById("color");
  const currentColor = colorElement.href.split('/').pop();
  const colorOrder = ["blue.css", "red.css", "green.css"];
  
  const currentIndex = colorOrder.indexOf(currentColor);
  const newColor = colorOrder[(currentIndex + 1) % 3];
  
  colorElement.href = `./${newColor}`;
  localStorage.setItem("currentColor", newColor);
});

window.addEventListener('load', function() {
  const savedColor = localStorage.getItem("currentColor") || "green.css";
  document.getElementById("color").href = `./${savedColor}`;
});

// 核心修改部分开始 -------------------------------------------------
fetch('markdownfile/files.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log("加载的文件列表:", data);
    loadFileList(data);
    
    // 新增调试信息
    console.log('白名单路径列表:', data.map(item => item.path));
    console.log('当前请求路径参数:', filePathParam);

    // 优化后的校验逻辑（关键修改点）
    const isValidFile = data.some(item => {
      // 对白名单路径进行编码比较
      const encodedListItem = encodeURIComponent(item.path);
      return encodedListItem === filePathParam;
    });

    if (isValidFile) {
      console.log('校验通过，开始加载文件...');
      loadMarkdown(finalPath, 'markdownContent');
    } else {
      console.warn('文件校验失败：路径不存在于白名单');
      document.getElementById('markdownContent').innerHTML = _error_message;
    }
  })
  .catch(error => {
    console.error('加载失败:', error);
    document.getElementById('markdownContent').innerHTML = `
      <div class="error">
        <h2>配置加载失败</h2>
        <p>${error.message}</p>
      </div>`;
  });

// 增强文件列表生成函数
function loadFileList(files) {
  const baseUrl = window.location.origin + window.location.pathname;
  let fileListHtml = '<ul class="file-tree">';
  
  files.forEach(file => {
    const encodedPath = encodeURIComponent(file.path);
    // 添加链接生成日志
    console.log(`生成文件链接：${file.path} => ${encodedPath}`);

    fileListHtml += `
      <li class="${file.path.startsWith('http') ? 'remote-file' : 'local-file'}">
        <a href="${baseUrl}?path=${encodedPath}">
          📄 ${file.name}
          ${file.description ? `<span class="file-desc">${file.description}</span>` : ''}
        </a>
      </li>`;
  });
  
  fileListHtml += '</ul>';
  document.getElementById('sidebarContent').innerHTML = fileListHtml;
}
// 核心修改部分结束 -------------------------------------------------

// [保持原有Markdown加载逻辑不变...]
function loadMarkdown(url, elementId) {
  const isRemote = url.startsWith('http');
  const startTime = Date.now();
  
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return response.text();
    })
    .then(markdownText => {
      const renderTime = Date.now() - startTime;
      console.log(`文件加载成功，耗时 ${renderTime}ms`);
      
      const htmlContent = marked.parse(markdownText, {
        breaks: true,
        gfm: true
      });
      
      document.getElementById(elementId).innerHTML = htmlContent;
      
      setTimeout(() => {
        renderMathInElement(document.getElementById(elementId), {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      }, 50);
    })
    .catch(error => {
      console.error('加载失败:', error);
      document.getElementById(elementId).innerHTML = `
        <div class="error">
          <h2>内容加载失败</h2>
          <p>${error.message}</p>
          ${isRemote ? '<p>⚠️ 远程文件加载失败，请检查网络连接</p>' : ''}
        </div>`;
    });
}

document.getElementById('fileListButton').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('active');
});

document.getElementById('hidefileListButton').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
});

// 点击内容区域关闭侧边栏
document.getElementById('markdownContent').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
});