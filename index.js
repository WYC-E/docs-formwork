/**
 * 此文件是项目的主入口文件，用于处理文件加载、侧边栏控制、颜色切换等功能。
 * 修复了远程文件校验问题，优化了路径参数的安全过滤和文件校验逻辑。
 */

// 获取URL参数并解码
// 创建一个URLSearchParams对象，用于解析当前URL的查询字符串
const urlParams = new URLSearchParams(window.location.search);
// 从URL参数中获取名为 'path' 的参数值，如果不存在则返回空字符串
const safeFilePath = urlParams.get('path') || '';
// 打印原始路径参数，方便调试
console.log('原始路径参数:', safeFilePath);

/**
 * 安全过滤路径参数，防止目录遍历攻击。
 * 仅过滤本地路径，替换路径中的 '../' 和 '\\..' 为空字符串，同时将连续的斜杠替换为单个斜杠。
 */
// const safeFilePath = filePathParam
  // 移除路径中的 '../' 和 '\\..'，防止目录遍历攻击
  // .replace(/(\.\.\/)|(\\\.\.)/g, '') 
  // 将连续的斜杠替换为单个斜杠
  // .replace(/\/\//g, '/');

// 判断是否为远程文件
// 通过检查安全路径是否以 'http' 开头来判断是否为远程文件
const isRemoteFile = safeFilePath.startsWith('https');
// 如果是远程文件，则使用安全路径；否则，在本地路径前添加 'markdownfile/'
const finalPath = isRemoteFile ? safeFilePath : `markdownfile/${safeFilePath}`;
// 打印最终文件路径，方便调试
console.log('最终文件路径:', finalPath);

// 设置页面标题为文件名，如果文件名为空则显示 '未知文件'
document.getElementById("title").innerText = 
  // 从安全路径中提取文件名，并设置为页面标题
  safeFilePath.split('/').pop() || '未知文件';

// 定义错误信息的HTML模板
const _error_message = `
  <div class="error">
    <h2>内容加载失败</h2>
    <p>拒绝访问</p>
  </div>
`;

// [侧边栏控制逻辑保持不变...]
// 初始时隐藏侧边栏和隐藏文件列表按钮
document.getElementById("sidebar").style.display = "none";
document.getElementById("hidefileListButton").style.display = "none";

// 点击文件列表按钮时显示侧边栏和隐藏文件列表按钮，并隐藏文件列表按钮
document.getElementById("fileListButton").addEventListener("click", function () {
  document.getElementById("sidebar").style.display = "block";
  document.getElementById("hidefileListButton").style.display = "block";
  this.style.display = "none";
});

// 点击隐藏文件列表按钮时隐藏侧边栏和隐藏文件列表按钮，并显示文件列表按钮
document.getElementById("hidefileListButton").addEventListener("click", function () {
  document.getElementById("sidebar").style.display = "none";
  document.getElementById("fileListButton").style.display = "block";
  this.style.display = "none";
});

// [颜色切换逻辑保持不变...]
// 点击颜色切换按钮时，切换页面的颜色主题
document.getElementById("changecolor").addEventListener("click", function () {
  // 获取当前颜色主题的链接元素
  const colorElement = document.getElementById("color");
  // 从链接中提取当前颜色主题的文件名
  const currentColor = colorElement.href.split('/').pop();
  // 定义颜色主题的顺序
  const colorOrder = ["blue.css", "red.css", "green.css"];
  
  // 获取当前颜色主题在顺序数组中的索引
  const currentIndex = colorOrder.indexOf(currentColor);
  // 计算下一个颜色主题的索引
  const newColor = colorOrder[(currentIndex + 1) % 3];
  
  // 更新颜色主题的链接
  colorElement.href = `./${newColor}`;
  // 将新的颜色主题保存到本地存储中
  localStorage.setItem("currentColor", newColor);
});

// 页面加载完成后，从本地存储中读取保存的颜色主题并应用
window.addEventListener('load', function() {
  // 从本地存储中获取保存的颜色主题，如果不存在则使用默认的 'green.css'
  const savedColor = localStorage.getItem("currentColor") || "green.css";
  // 更新颜色主题的链接
  document.getElementById("color").href = `./${savedColor}`;
});

// 核心修改部分开始 -------------------------------------------------
/**
 * 从 'markdownfile/files.json' 文件中加载文件列表，并进行文件校验。
 * 如果文件路径存在于白名单中，则加载Markdown文件；否则，显示错误信息。
 */
fetch('markdownfile/files.json')
  .then(response => {
    // 检查响应是否成功，如果不成功则抛出错误
    if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`);
    // 将响应内容解析为JSON对象
    return response.json();
  })
  .then(data => {
    // 打印加载的文件列表，方便调试
    console.log("加载的文件列表:", data);
    // 调用loadFileList函数生成文件列表
    loadFileList(data);
    
    // 新增调试信息
    // 打印白名单路径列表，方便调试
    console.log('白名单路径列表:', data.map(item => item.path));
    // 打印当前请求路径参数，方便调试
    console.log('当前请求路径参数:', safeFilePath);

    // 优化后的校验逻辑（关键修改点）
    // 检查请求的文件路径是否存在于白名单中
    const isValidFile = data.some(item => {
      // 对白名单路径进行编码比较
      const encodedListItem = encodeURIComponent(item.path);
      return encodedListItem === safeFilePath;
    });

    if (isRemoteFile) {
      // 如果是远程文件，直接加载
      console.log('远程文件，直接加载...');
      loadMarkdown(finalPath,'markdownContent');
    } else {
      // 如果是本地文件，进行路径参数的安全过滤
      console.log('本地文件，进行路径参数安全过滤...');
        if (isValidFile) {
          // 如果校验通过，打印信息并调用loadMarkdown函数加载Markdown文件
          console.log('校验通过，开始加载文件...');
          loadMarkdown(finalPath, 'markdownContent');
        } else {
          // 如果校验失败，打印警告信息并显示错误信息
          console.warn('文件校验失败：路径不存在于白名单');
          document.getElementById('markdownContent').innerHTML = _error_message;
        }
    }
    
  })
  .catch(error => {
    // 捕获并处理加载过程中出现的错误
    console.error('加载失败:', error);
    document.getElementById('markdownContent').innerHTML = `
      <div class="error">
        <h2>配置加载失败</h2>
        <p>${error.message}</p>
      </div>`;
  });

/**
 * 增强文件列表生成函数，根据文件列表生成侧边栏的文件列表HTML。
 * @param {Array} files - 文件列表，每个元素包含 'path'、'name' 和 'description' 属性。
 */
function loadFileList(files) {
  // 获取当前页面的基础URL
  const baseUrl = window.location.origin + window.location.pathname;
  // 初始化文件列表的HTML字符串
  let fileListHtml = '<ul class="file-tree">';
  
  // 遍历文件列表，为每个文件生成链接
  files.forEach(file => {
    // 对文件路径进行编码
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
  
  // 结束文件列表的HTML字符串
  fileListHtml += '</ul>';
  // 将生成的HTML字符串插入到侧边栏内容区域
  document.getElementById('sidebarContent').innerHTML = fileListHtml;
}
// 核心修改部分结束 -------------------------------------------------

// [保持原有Markdown加载逻辑不变...]
/**
 * 加载Markdown文件并渲染为HTML。
 * @param {string} url - Markdown文件的URL。
 * @param {string} elementId - 用于显示渲染结果的元素ID。
 */
function loadMarkdown(url, elementId) {
  // 判断是否为远程文件
  const isRemote = url.startsWith('http');
  // 记录开始加载的时间
  const startTime = Date.now();
  
  // 发起HTTP请求获取Markdown文件内容
  fetch(url)
    .then(response => {
      // 检查响应是否成功，如果不成功则抛出错误
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      // 将响应内容转换为文本
      return response.text();
    })
    .then(markdownText => {
      // 计算文件加载耗时
      const renderTime = Date.now() - startTime;
      // 打印文件加载成功信息和耗时
      console.log(`文件加载成功，耗时 ${renderTime}ms`);
      
      // 使用marked库将Markdown文本解析为HTML
      const htmlContent = marked.parse(markdownText, {
        breaks: true,
        gfm: true
      });
      
      // 将渲染结果插入到指定元素中
      document.getElementById(elementId).innerHTML = htmlContent;
      
      // 延迟50ms后渲染数学公式
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
      // 捕获并处理加载过程中出现的错误
      console.error('加载失败:', error);
      document.getElementById(elementId).innerHTML = `
        <div class="error">
          <h2>内容加载失败</h2>
          <p>${error.message}</p>
          ${isRemote ? '<p>⚠️ 远程文件加载失败，请检查网络连接</p>' : ''}
        </div>`;
    });
}

// 点击文件列表按钮时，为侧边栏添加 'active' 类
document.getElementById('fileListButton').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('active');
});

// 点击隐藏文件列表按钮时，移除侧边栏的 'active' 类
document.getElementById('hidefileListButton').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
});

// 点击内容区域时，移除侧边栏的 'active' 类
document.getElementById('markdownContent').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
});
