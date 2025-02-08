Function Planner: Enhance the function.

```javascript
<code _ngcontent-ng-c3106559761="" role="text" data-test-id="code-content" class="code-container formatted ng-tns-c3106559761-66" data-sourcepos="1:1-55:1"><span class="hljs-keyword">async</span> <span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">scrapeLovesac</span>(<span class="hljs-params"></span>) </span>{
  <span class="hljs-keyword">const</span> browser = <span class="hljs-keyword">await</span> chromium.launch({ <span class="hljs-attr">headless</span>: <span class="hljs-literal">false</span> });
  <span class="hljs-keyword">const</span> page = <span class="hljs-keyword">await</span> browser.newPage();

  <span class="hljs-keyword">const</span> productDataFolder = path.join(<span class="hljs-string">'Extracted_Data'</span>, <span class="hljs-string">"Product_Data"</span>);
  <span class="hljs-keyword">const</span> reviewsDataFolder = path.join(<span class="hljs-string">'Extracted_Data'</span>, <span class="hljs-string">"Reviews_Data"</span>);
  fs.mkdirSync(productDataFolder, { <span class="hljs-attr">recursive</span>: <span class="hljs-literal">true</span> });
  fs.mkdirSync(reviewsDataFolder, { <span class="hljs-attr">recursive</span>: <span class="hljs-literal">true</span> });

  <span class="hljs-keyword">await</span> page.goto(<span class="hljs-string">"https://www.lovesac.com/"</span>, { <span class="hljs-attr">waitUntil</span>: <span class="hljs-string">"domcontentloaded"</span> });
  <span class="hljs-keyword">await</span> page.waitForTimeout(<span class="hljs-number">4000</span>);
  <span class="hljs-keyword">const</span> anchorTags = <span class="hljs-keyword">await</span> page.locator(<span class="hljs-string">"//a[@href and @title and contains(@class, 'button')]"</span>);
  <span class="hljs-keyword">const</span> count = <span class="hljs-keyword">await</span> anchorTags.count();

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; count; i++) {
    <span class="hljs-keyword">const</span> href = <span class="hljs-keyword">await</span> anchorTags.nth(i).getAttribute(<span class="hljs-string">"href"</span>);
    <span class="hljs-keyword">const</span> title = <span class="hljs-keyword">await</span> anchorTags.nth(i).getAttribute(<span class="hljs-string">"title"</span>);

    <span class="hljs-keyword">if</span> (!href.startsWith(<span class="hljs-string">"/"</span>)) {
      <span class="hljs-keyword">continue</span>;
    }

    <span class="hljs-keyword">const</span> newPage = <span class="hljs-keyword">await</span> browser.newPage();

    newPage.on(<span class="hljs-string">"response"</span>, <span class="hljs-keyword">async</span> (response) =&gt; {
      <span class="hljs-keyword">const</span> url = response.url();
      <span class="hljs-keyword">if</span> (url.includes(<span class="hljs-string">"lovesac.com/graphql"</span>)) {
        <span class="hljs-keyword">try</span> {
          <span class="hljs-keyword">const</span> json = <span class="hljs-keyword">await</span> response.json();
          <span class="hljs-keyword">let</span> folder;
          <span class="hljs-keyword">if</span> (json.data?.reviews?.reviews?.length &gt; <span class="hljs-number">0</span>) {
            folder = reviewsDataFolder;
          } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (json.data?.products?.length &gt; <span class="hljs-number">0</span>) {
            folder = productDataFolder;
          } <span class="hljs-keyword">else</span> {
            <span class="hljs-keyword">return</span>;
          }
          <span class="hljs-keyword">const</span> fileName = <span class="hljs-string">`<span class="hljs-subst">${title}</span>.json`</span>;
          <span class="hljs-keyword">const</span> filePath = path.join(folder, fileName);
          fs.writeFileSync(filePath, <span class="hljs-built_in">JSON</span>.stringify(json, <span class="hljs-literal">null</span>, <span class="hljs-number">2</span>));
        } <span class="hljs-keyword">catch</span> (error) {
          <span class="hljs-built_in">console</span>.error(<span class="hljs-string">"Error processing JSON:"</span>, error);
        }
      }
    });

    <span class="hljs-keyword">await</span> newPage.goto(<span class="hljs-string">`https://www.lovesac.com<span class="hljs-subst">${href}</span>`</span>, {<span class="hljs-attr">waitUntil</span>: <span class="hljs-string">"domcontentloaded"</span>});
    <span class="hljs-keyword">await</span> newPage.waitForTimeout(<span class="hljs-number">30000</span>);
    <span class="hljs-keyword">await</span> newPage.close();
  }

  <span class="hljs-keyword">await</span> browser.close();
}
</code>
```