document.addEventListener('DOMContentLoaded', function() {
    // Search data structure to hold all searchable content
    const searchData = [];
    const searchInput = document.querySelector('.search-container input');
    const searchResults = document.getElementById('searchResults');
    
    // Base URL will be loaded from sitemap.json
    let siteBaseUrl = '';
    
    // Determine current page path relative to site root
    function getCurrentPath() {
        const path = window.location.pathname;
        // If we're on GitHub Pages or similar hosting, handle the repository name in the path
        const basePath = siteBaseUrl ? new URL(siteBaseUrl).pathname : '';
        if (basePath && path.startsWith(basePath)) {
            return path.substring(basePath.length) || '/';
        }
        return path;
    }
    
    // Function to normalize a URL with the correct base path
    function normalizeUrl(url, currentPath = getCurrentPath()) {
        // If it's already an absolute URL with http/https, return it
        if (url.startsWith('http')) {
            return url;
        }
        
        // Handle paths based on whether they're absolute or relative
        let normalizedPath;
        
        if (url.startsWith('/')) {
            // Absolute path from site root
            normalizedPath = url;
        } else {
            // Relative path from current directory
            const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
            normalizedPath = currentDir + url;
            
            // Handle ".." in paths (up one directory)
            while (normalizedPath.includes('/../')) {
                const beforeParent = normalizedPath.substring(0, normalizedPath.indexOf('/../'));
                const parentDir = beforeParent.substring(0, beforeParent.lastIndexOf('/'));
                const afterParent = normalizedPath.substring(normalizedPath.indexOf('/../') + 4);
                normalizedPath = parentDir + '/' + afterParent;
            }
            
            // Handle "./" in paths (current directory)
            normalizedPath = normalizedPath.replace(/\/\.\//g, '/');
        }
        
        // Ensure the path starts with /
        if (!normalizedPath.startsWith('/')) {
            normalizedPath = '/' + normalizedPath;
        }
        
        // Construct full URL with base
        return siteBaseUrl + normalizedPath;
    }
    
    // Function to fetch HTML content from a URL
    async function fetchContent(url) {
        try {
            console.log("Fetching:", url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
        }
    }
    
    // Extract content from HTML for search indexing
    function extractContent(html, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get page title
        const title = doc.querySelector('title')?.textContent || 
                      doc.querySelector('h1')?.textContent || 
                      'Untitled Page';
        
        // Get page content (prioritize main content areas)
        const mainContent = doc.querySelector('main, .base-body, .content, article');
        let content = '';
        
        if (mainContent) {
            // Use main content if available
            content = mainContent.textContent;
        } else {
            // Fallback to body content, excluding navigation and footer
            const body = doc.body;
            const nav = doc.querySelector('nav');
            const footer = doc.querySelector('footer');
            
            // Clone body to avoid modifying the original
            const bodyClone = body.cloneNode(true);
            
            // Remove nav and footer if they exist
            if (nav) {
                const navInClone = bodyClone.querySelector('nav');
                if (navInClone) bodyClone.removeChild(navInClone);
            }
            if (footer) {
                const footerInClone = bodyClone.querySelector('footer');
                if (footerInClone) bodyClone.removeChild(footerInClone);
            }
            
            content = bodyClone.textContent;
        }
        
        // Clean up content
        content = content.replace(/\s+/g, ' ').trim().toLowerCase();
        
        // Create a preview (first ~150 characters)
        const preview = content.substring(0, 150) + '...';
        
        // Determine page type from URL 
        let type = 'page'; // Default type
        
        // Check against common patterns first
        if (url.includes('/blog/')) {
            type = 'blog';
        } else if (url.includes('/events/')) {
            type = 'event';
        } else if (url.includes('/about.html')) {
            type = 'about';
        } else if (url.includes('/events.html')) {
            type = 'event';
        } else if (url.includes('/blog.html')) {
            type = 'blog';
        } else if (url.includes('/index.html') || url.endsWith('/')) {
            type = 'home';
        }

        return {
            title,
            content,
            preview,
            url,
            type,
            relPath: getRelativePath(url)
        };
    }
    
    // Convert absolute URL to site-relative path
    function getRelativePath(url) {
        if (url.startsWith(siteBaseUrl)) {
            return url.substring(siteBaseUrl.length);
        }
        return url;
    }
    
    // Fix any relative links in the current page
    function fixPageLinks() {
        // Find all links in the document
        const links = document.querySelectorAll('a[href]');
        const currentPath = getCurrentPath();
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            // Only fix internal links (not external, anchors, mail, etc.)
            if (href && !href.startsWith('http') && !href.startsWith('#') && 
                !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                
                // Get proper URL with base path
                const fixedHref = normalizeUrl(href, currentPath);
                link.setAttribute('href', fixedHref);
            }
        });
    }
    
    // Determine the correct path to sitemap.json based on current location
    function getSitemapPath() {
        // First, try to determine based on the script's location
        const scripts = document.getElementsByTagName('script');
        for (const script of scripts) {
            const src = script.src;
            if (src && src.includes('search.js')) {
                // If this is our script, the sitemap should be in the same directory
                return src.substring(0, src.lastIndexOf('/') + 1) + 'sitemap.json';
            }
        }

        // Fallback approach based on current page path
        const currentPath = window.location.pathname;
        
        // For GitHub Pages, handle the repository name in the path
        const repoMatch = currentPath.match(/\/[^\/]+\/[^\/]+\//);
        const baseRepo = repoMatch ? repoMatch[0] : '';
        
        // Normalize the path by removing the repository part
        let tempPath = currentPath.replace(baseRepo, '/');
        
        // If we're in the root directory or index.html
        if (tempPath === '/' || tempPath.endsWith('/index.html') || tempPath.endsWith('/')) {
            return 'assets/js/sitemap.json';
        }
        
        // Otherwise build a path based on directory depth
        const pathParts = tempPath.split('/').filter(part => length > 0);
        let dirCount = pathParts.length;
        
        // If the last part is a file (has an extension), reduce directory count by 1
        if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes('.')) {
            dirCount--;
        }
        
        // Build relative path with appropriate number of "../"
        return '../'.repeat(dirCount) + 'assets/js/sitemap.json';
    }
    
    // Main function to build the search index
    async function buildSearchIndex() {
        searchData.length = 0; // Clear existing data
        
        let sitemapData = null;
        let loadedPath = null;
        
        // Try direct path first - since both files are in the same directory
        try {
            // Simple approach - Try to load the sitemap right from the same directory
            console.log("Attempting to load sitemap from same directory");
            const response = await fetch('sitemap.json');
            
            if (response.ok) {
                sitemapData = await response.json();
                loadedPath = 'sitemap.json';
                console.log("Successfully loaded sitemap from same directory");
            }
        } catch (error) {
            console.warn("Failed initial sitemap loading attempt:", error.message);
        }
        
        // If direct approach failed, try other paths
        if (!sitemapData) {
            // Fallback paths to try, in order of likelihood
            const possiblePaths = [
                './sitemap.json',                                             // Same directory, explicit
                window.location.pathname.includes('/pages/') ? 
                    '../../assets/js/sitemap.json' :                          // From pages directory
                    './assets/js/sitemap.json',                               // From root
                '../assets/js/sitemap.json',                                  // One level up
                '../../assets/js/sitemap.json',                               // Two levels up
                '/assets/js/sitemap.json',                                    // Absolute from site root
            ];
            
            // Try each path until we find the sitemap
            for (const path of possiblePaths) {
                try {
                    console.log("Attempting to load sitemap from:", path);
                    const response = await fetch(path);
                    
                    if (response.ok) {
                        sitemapData = await response.json();
                        loadedPath = path;
                        console.log("Successfully loaded sitemap from:", path);
                        break;
                    }
                } catch (error) {
                    console.warn(`Failed to load sitemap from ${path}:`, error.message);
                }
            }
        }
        
        // As a final fallback, try to construct the path based on the script's location
        if (!sitemapData) {
            try {
                const scriptElements = document.getElementsByTagName('script');
                let scriptPath = '';
                
                // Find the search.js script path
                for (const script of scriptElements) {
                    if (script.src && script.src.includes('search.js')) {
                        scriptPath = script.src;
                        break;
                    }
                }
                
                if (scriptPath) {
                    // Replace 'search.js' with 'sitemap.json' in the script's URL path
                    const sitemapUrl = scriptPath.replace(/search\.js(\?.*)?$/, 'sitemap.json');
                    console.log("Final attempt - loading sitemap directly from script path:", sitemapUrl);
                    
                    const response = await fetch(sitemapUrl);
                    if (response.ok) {
                        sitemapData = await response.json();
                        loadedPath = sitemapUrl;
                        console.log("Successfully loaded sitemap from script path:", sitemapUrl);
                    }
                }
            } catch (error) {
                console.error("Script path resolution failed:", error);
            }
        }
        
        if (!sitemapData) {
            const errorMsg = "Could not load sitemap.json. Please check the console for details.";
            console.error("All sitemap loading attempts failed");
            searchResults.innerHTML = `<div class="search-error">${errorMsg}</div>`;
            searchResults.classList.add('active');
            return;
        }
        
        // If we've reached here, we have successfully loaded the sitemap
        // Set the base URL from the sitemap
        siteBaseUrl = sitemapData.baseUrl;
        console.log("Using base URL from sitemap:", siteBaseUrl);
        
        // Now that we have the base URL, fix links in the current page
        fixPageLinks();
        
        console.log("Building search index using sitemap with", sitemapData.sitemap.length, "pages");
        
        // Process the sitemap data to build search index
        for (const page of sitemapData.sitemap) {
            // Create initial placeholder entry with metadata from sitemap
            const pageUrl = normalizeUrl(page.url);
            
            // Use whatever information we have from the sitemap
            const initialData = {
                title: page.title || getFileNameFromUrl(page.url),
                content: '',  // Will be populated after fetching
                preview: 'Loading content...',
                url: pageUrl,
                type: page.badge || 'page',
                relPath: page.url
            };
            
            // Add to search index immediately so we have basic search functionality
            searchData.push(initialData);
            
            // Fetch the HTML asynchronously to populate the content
            fetchAndUpdateContent(pageUrl, initialData);
        }
        
        // Set up search debounce
        setupSearchDebounce();
    }
    
    // Extract a filename from a URL for a default title
    function getFileNameFromUrl(url) {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        
        // If it ends with .html, remove the extension
        if (lastPart.endsWith('.html')) {
            return lastPart.substring(0, lastPart.length - 5)
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
        }
        
        // Handle index.html or empty (directory)
        if (lastPart === 'index.html' || lastPart === '') {
            // Get the directory name
            const dirName = parts[parts.length - 2] || 'Home';
            return dirName.charAt(0).toUpperCase() + dirName.slice(1);
        }
        
        return lastPart;
    }
    
    // Fetch HTML content and update the search index
    async function fetchAndUpdateContent(url, indexEntry) {
        try {
            const html = await fetchContent(url);
            
            if (html) {
                // Extract content data
                const contentData = extractContent(html, url);
                
                // Update the index entry with the extracted content
                indexEntry.content = contentData.content;
                indexEntry.preview = contentData.preview;
                
                // If the sitemap didn't provide a title, use the one from the HTML
                if (!indexEntry.title || indexEntry.title === getFileNameFromUrl(url)) {
                    indexEntry.title = contentData.title;
                }
                
                console.log("Content updated for:", indexEntry.title);
            }
        } catch (error) {
            console.error(`Error updating content for ${url}:`, error);
        }
    }
    
    // Set up debounced search to avoid excessive processing
    function setupSearchDebounce() {
        let debounceTimer;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(performSearch, 300);
        });
        
        // Also search on focus if there's already text
        searchInput.addEventListener('focus', function() {
            if (searchInput.value.trim()) {
                performSearch();
            }
        });
        
        // Add keyboard navigation for results
        searchInput.addEventListener('keydown', function(e) {
            if (searchResults.classList.contains('active')) {
                const resultItems = searchResults.querySelectorAll('.search-result-item');
                const activeItem = searchResults.querySelector('.search-result-item.active');
                let activeIndex = -1;
                
                if (activeItem) {
                    activeIndex = Array.from(resultItems).indexOf(activeItem);
                }
                
                // Handle arrow keys
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (activeIndex < resultItems.length - 1) {
                        if (activeItem) activeItem.classList.remove('active');
                        resultItems[activeIndex + 1].classList.add('active');
                        resultItems[activeIndex + 1].scrollIntoView({ block: 'nearest' });
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (activeIndex > 0) {
                        if (activeItem) activeItem.classList.remove('active');
                        resultItems[activeIndex - 1].classList.add('active');
                        resultItems[activeIndex - 1].scrollIntoView({ block: 'nearest' });
                    }
                } else if (e.key === 'Enter' && activeItem) {
                    e.preventDefault();
                    window.location.href = activeItem.getAttribute('data-url');
                }
            }
        });
    }
    
    // Function to perform the search
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        // Clear results if query is empty
        if (!query) {
            searchResults.classList.remove('active');
            searchResults.innerHTML = '';
            return;
        }
        
        // Filter search data
        let results = searchData.filter(item => {
            // Check for matches in title and content
            const titleMatch = item.title.toLowerCase().includes(query);
            const contentMatch = item.content && item.content.includes(query);
            
            // Also check URL path for matches
            const pathMatch = item.relPath && item.relPath.toLowerCase().includes(query);
            
            return titleMatch || contentMatch || pathMatch;
        });
        
        // Sort by relevance with multiple factors
        results.sort((a, b) => {
            // Calculate relevance scores
            const aScore = calculateRelevance(a, query);
            const bScore = calculateRelevance(b, query);
            
            // Higher scores first
            return bScore - aScore;
        });
        
        // Display results
        displayResults(results, query);
    }
    
    // Calculate a relevance score for sorting results
    function calculateRelevance(item, query) {
        let score = 0;
        
        // Title matches are most important
        if (item.title.toLowerCase().includes(query)) {
            score += 100;
            // Exact title match is even better
            if (item.title.toLowerCase() === query) {
                score += 50;
            }
            // Title starting with query is also good
            if (item.title.toLowerCase().startsWith(query)) {
                score += 25;
            }
        }
        
        // Content matches
        if (item.content && item.content.includes(query)) {
            score += 50;
            
            // How many times the query appears in content
            const matches = item.content.split(query).length - 1;
            score += Math.min(matches, 10) * 2; // Cap at 20 points for frequency
        }
        
        // Path matches
        if (item.relPath && item.relPath.toLowerCase().includes(query)) {
            score += 30;
        }
        
        // Boost home page and important sections
        if (item.type === 'home') score += 10;
        if (item.type === 'about') score += 5;
        
        return score;
    }
    
    // Function to display search results
    function displayResults(results, query) {
        searchResults.innerHTML = '';
        
        // Show the results container if we have results
        if (results.length > 0) {
            searchResults.classList.add('active');
            
            // Create header
            const header = document.createElement('div');
            header.className = 'search-results-header';
            header.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''}`;
            searchResults.appendChild(header);
            
            // Add results
            results.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.setAttribute('data-url', result.url);
                
                // Add result type badge
                const typeBadge = document.createElement('span');
                typeBadge.className = 'result-type-badge ' + result.type;
                typeBadge.textContent = result.type.charAt(0).toUpperCase() + result.type.slice(1);
                resultItem.appendChild(typeBadge);
                
                // Add title with highlighted query
                const title = document.createElement('h4');
                title.innerHTML = highlightText(result.title, query);
                resultItem.appendChild(title);
                
                // Add preview
                const preview = document.createElement('p');
                preview.innerHTML = highlightText(result.preview, query);
                resultItem.appendChild(preview);
                
                // Make clickable
                resultItem.addEventListener('click', () => {
                    // Navigate to the page
                    window.location.href = result.url;
                });
                
                searchResults.appendChild(resultItem);
            });
            
            // Set first result as active for keyboard navigation
            const firstResult = searchResults.querySelector('.search-result-item');
            if (firstResult) {
                firstResult.classList.add('active');
            }
        } else {
            // Show no results message
            searchResults.classList.add('active');
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = `No results found for "${query}"`;
            searchResults.appendChild(noResults);
        }
    }
    
    // Function to highlight search query in text
    function highlightText(text, query) {
        if (!query || !text) return text || '';
        
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }
    
    // Escape special regex characters to safely use in RegExp
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Close search results when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.remove('active');
        }
    });

    // Initialize search index when the page loads
    buildSearchIndex();
    
    // Add this function to window to be callable from HTML
    window.performSearch = performSearch;
});