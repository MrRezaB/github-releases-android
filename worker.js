// github-releases-worker.js
// نمایش ریلیزهای گیتهاب با قابلیت‌های پیشرفته

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// لیست ریپوزیتوری‌های به‌روز شده با توضیحات
const REPOSITORIES = [
  {
    name: "2dust/v2rayNG",
    description: "کلاینت V2Ray برای اندروید"
  },
  {
    name: "SagerNet/sing-box",
    description: "جعبه اتصال چندپروتکلی"
  },
  {
    name: "j-hc/revanced-magisk-module",
    description: "ماژول Magisk برای ReVanced"
  },
  {
    name: "KaringX/clashmi",
    description: "مدیریت Clash برای MIUI"
  },
  {
    name: "gonzazoid/Ultimatum",
    description: "پروژه Ultimatum"
  },
  {
    name: "amnezia-vpn/amnezia-client",
    description: "کلاینت Amnezia VPN"
  }
]

const GITHUB_HEADERS = {
  'User-Agent': 'Cloudflare-Worker-Release-Checker',
  'Accept': 'application/vnd.github.v3+json'
}

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.pathname === '/') {
    try {
      const reposData = await Promise.all(
        REPOSITORIES.map(async repo => {
          try {
            const releases = await fetchReleases(repo.name)
            return {
              ...repo,
              releases,
              lastUpdated: releases[0]?.published_at || '1970-01-01T00:00:00Z',
              error: null
            }
          } catch (error) {
            return {
              ...repo,
              releases: [],
              lastUpdated: '1970-01-01T00:00:00Z',
              error: error.message
            }
          }
        })
      )
      
      reposData.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      
      let html = generateHtmlHeader()
      
      reposData.forEach(data => {
        if (data.error) {
          html += generateErrorSection(data)
        } else if (data.releases.length === 0) {
          html += generateEmptySection(data)
        } else {
          html += generateRepoSection(data)
        }
      })
      
      html += generateHtmlFooter()
      
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } catch (error) {
      return createErrorResponse('خطا در پردازش درخواست: ' + error.message, 500)
    }
  }
  
  return createErrorResponse('صفحه مورد نظر یافت نشد!', 404)
}

async function fetchReleases(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    headers: GITHUB_HEADERS
  })

  if (!response.ok) {
    throw new Error(`خطای HTTP: ${response.status}`)
  }

  const releases = await response.json()
  
  if (!Array.isArray(releases)) {
    throw new Error('فرمت داده نامعتبر')
  }

  return releases
}

function generateHtmlHeader() {
  return `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>آخرین به‌روزرسانی‌های برنامه‌ها</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --primary-color: #2b6cb0;
      --secondary-color: #4299e1;
      --text-color: #2d3748;
      --light-bg: #f7fafc;
      --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s ease;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      color: var(--text-color);
      line-height: 1.6;
      padding: 0;
      margin: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 2rem 0;
      text-align: center;
      margin-bottom: 2rem;
      box-shadow: var(--card-shadow);
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    .repo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 25px;
      padding: 20px;
    }
    
    .repo-card {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    
    .repo-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }
    
    .card-header {
      display: flex;
      align-items: center;
      padding: 15px;
      background: var(--light-bg);
      border-bottom: 1px solid #e2e8f0;
    }
    
    .app-info {
      flex: 1;
    }
    
    .app-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 3px;
    }
    
    .app-repo {
      font-size: 0.85rem;
      color: #4a5568;
    }
    
    .app-desc {
      font-size: 0.8rem;
      color: #4a5568;
      margin-top: 3px;
    }
    
    .github-link {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
    }
    
    .github-link:hover {
      text-decoration: underline;
    }
    
    .github-icon {
      width: 18px;
      margin-left: 5px;
    }
    
    .card-body {
      padding: 20px;
      flex: 1;
    }
    
    .release-date {
      display: flex;
      align-items: center;
      color: #718096;
      font-size: 0.9rem;
      margin-bottom: 15px;
    }
    
    .date-icon {
      width: 16px;
      margin-left: 5px;
    }
    
    .release-notes {
      background: var(--light-bg);
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-size: 0.95rem;
      line-height: 1.7;
      position: relative;
    }
    
    .show-more-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      margin-top: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: var(--transition);
    }
    
    .show-more-btn:hover {
      background: var(--secondary-color);
    }
    
    .downloads-title {
      font-size: 1rem;
      margin-bottom: 10px;
      color: var(--text-color);
    }
    
    .download-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }
    
    .remaining-files {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
    }
    
    .download-btn {
      display: inline-block;
      padding: 6px 12px;
      background: var(--primary-color);
      color: white;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.85rem;
      transition: var(--transition);
    }
    
    .download-btn:hover {
      background: var(--secondary-color);
      transform: translateY(-2px);
    }
    
    .show-more-btn.files-btn {
      background: #e2e8f0;
      color: var(--primary-color);
      border: 1px solid #cbd5e0;
      width: 100%;
      text-align: center;
      margin-top: 0;
    }
    
    .show-more-btn.files-btn:hover {
      background: #cbd5e0;
    }
    
    .error-card {
      background: #fff5f5;
      color: #c53030;
      padding: 20px;
      border-left: 4px solid #c53030;
    }
    
    .empty-card {
      background: #f0fff4;
      color: #2f855a;
      padding: 20px;
      border-left: 4px solid #2f855a;
    }
    
    footer {
      text-align: center;
      padding: 20px;
      margin-top: 40px;
      color: #718096;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .repo-grid {
        grid-template-columns: 1fr;
      }
      
      h1 {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>آخرین به‌روزرسانی‌های برنامه‌ها</h1>
      <p class="subtitle">همیشه از جدیدترین نسخه‌ها مطلع باشید</p>
    </div>
  </header>
  
  <div class="repo-grid">
`
}

function generateRepoSection(data) {
  const latestRelease = data.releases[0];
  const releaseNotes = latestRelease.body || 'بدون توضیحات';
  const shortNotes = releaseNotes.length > 150 ? releaseNotes.substring(0, 150) + '...' : releaseNotes;
  const hasMoreNotes = releaseNotes.length > 150;
  
  // محدود کردن نمایش فایل‌ها به 3 مورد اول
  const maxInitialFiles = 3;
  const hasMoreFiles = latestRelease.assets.length > maxInitialFiles;
  const initialFiles = hasMoreFiles ? latestRelease.assets.slice(0, maxInitialFiles) : latestRelease.assets;
  const remainingFiles = hasMoreFiles ? latestRelease.assets.slice(maxInitialFiles) : [];

  return `
    <div class="repo-card">
      <div class="card-header">
        <div class="app-info">
          <div class="app-name">${latestRelease.name || latestRelease.tag_name}</div>
          <div class="app-repo">${data.name}</div>
          ${data.description ? `<div class="app-desc">${data.description}</div>` : ''}
        </div>
        <a href="https://github.com/${data.name}" class="github-link" target="_blank">
          گیتهاب
          <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        </a>
      </div>
      <div class="card-body">
        <div class="release-date">
          <svg class="date-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
          </svg>
          ${new Date(latestRelease.published_at).toLocaleString('fa-IR')}
        </div>
        
        <div class="release-notes">
          <h3 class="downloads-title">یادداشت انتشار:</h3>
          <div class="notes-short">${shortNotes}</div>
          ${hasMoreNotes ? `
            <div class="notes-full" style="display:none">${releaseNotes}</div>
            <button onclick="toggleNotes(this)" class="show-more-btn" data-state="short">
              نمایش کامل
            </button>
          ` : ''}
        </div>
        
        <h3 class="downloads-title">فایل‌های قابل دانلود (${latestRelease.assets.length}):</h3>
        <div class="download-list">
          ${initialFiles.map(asset => 
            `<a href="${asset.browser_download_url}" class="download-btn" target="_blank">${asset.name}</a>`
          ).join('')}
          
          ${hasMoreFiles ? `
            <div class="remaining-files" style="display:none">
              ${remainingFiles.map(asset => 
                `<a href="${asset.browser_download_url}" class="download-btn" target="_blank">${asset.name}</a>`
              ).join('')}
            </div>
            <button onclick="toggleFiles(this)" class="show-more-btn files-btn" data-state="short">
              نمایش ${remainingFiles.length} فایل بیشتر
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function generateErrorSection(data) {
  return `
    <div class="repo-card">
      <div class="card-header">
        <div class="app-info">
          <div class="app-name">${data.name.split('/')[1]}</div>
          <div class="app-repo">${data.name}</div>
          ${data.description ? `<div class="app-desc">${data.description}</div>` : ''}
        </div>
        <a href="https://github.com/${data.name}" class="github-link" target="_blank">
          گیتهاب
          <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        </a>
      </div>
      <div class="error-card">
        خطا در دریافت اطلاعات: ${data.error}
      </div>
    </div>
  `;
}

function generateEmptySection(data) {
  return `
    <div class="repo-card">
      <div class="card-header">
        <div class="app-info">
          <div class="app-name">${data.name.split('/')[1]}</div>
          <div class="app-repo">${data.name}</div>
          ${data.description ? `<div class="app-desc">${data.description}</div>` : ''}
        </div>
        <a href="https://github.com/${data.name}" class="github-link" target="_blank">
          گیتهاب
          <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        </a>
      </div>
      <div class="empty-card">
        هنوز هیچ نسخه‌ای منتشر نشده است
      </div>
    </div>
  `;
}

function generateHtmlFooter() {
  return `
  </div>
  
  <footer>
    <div class="container">
      آخرین بروزرسانی: ${new Date().toLocaleString('fa-IR')}
    </div>
  </footer>
  
  <script>
    function toggleNotes(btn) {
      const notesShort = btn.previousElementSibling.previousElementSibling;
      const notesFull = btn.previousElementSibling;
      
      if (btn.dataset.state === 'short') {
        notesShort.style.display = 'none';
        notesFull.style.display = 'block';
        btn.textContent = 'نمایش کمتر';
        btn.dataset.state = 'full';
      } else {
        notesShort.style.display = 'block';
        notesFull.style.display = 'none';
        btn.textContent = 'نمایش کامل';
        btn.dataset.state = 'short';
      }
    }
    
    function toggleFiles(btn) {
      const remainingFiles = btn.previousElementSibling;
      
      if (btn.dataset.state === 'short') {
        remainingFiles.style.display = 'flex';
        btn.textContent = 'نمایش کمتر';
        btn.dataset.state = 'full';
      } else {
        remainingFiles.style.display = 'none';
        const remainingCount = remainingFiles.children.length;
        btn.textContent = 'نمایش ' + remainingCount + ' فایل بیشتر';
        btn.dataset.state = 'short';
      }
    }
  </script>
</body>
</html>`;
}

function createErrorResponse(message, status) {
  return new Response(message, { 
    status: status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
