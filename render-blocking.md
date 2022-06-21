Eliminate render-blocking resources
======

**The goal is to reduce the impact of these render-blocking URLs by inlining critical resources, deferring non-critical resources, and removing anything unused.**
-----------

<img width="710" alt="image" src="https://user-images.githubusercontent.com/75945709/174877179-32c1e076-c048-4ae8-82e0-df7e82d95d94.png">

***Which URLs get flagged as render-blocking resources?***

A ```<script>``` tag that:

1. Is in the ```<head>``` of the document.

2. Does not have a ```defer``` attribute.

3. Does not have an ```async``` attribute.

A ```<link rel="stylesheet">``` tag that:

 1.Does not have a ```disabled``` attribute. When this attribute is present, the browser does not download the stylesheet.

 2.Does not have a ```media``` attribute that matches the user's device specifically.``` media="all"``` is considered render-blocking.

***How to identify critical resources ?***

The first step to reducing the impact of render-blocking resources, is to identify what's critical and what's not. Use the Coverage tab in Chrome DevTools to identify non-critical CSS and JS. When you load or run a page, the tab tells you how much code was used, versus how much was loaded:

<img width="960" alt="image" src="https://user-images.githubusercontent.com/75945709/174878861-20e04897-bf2a-4eb7-8030-1c534ba6c24c.png">

You can reduce the size of your pages by only shipping the code and styles that you need. Click on a URL to inspect that file in the Sources panel. Styles in CSS files and code in JavaScript files are marked in two colors:

- ***Blue (critical): Styles that are required for first paint; code that's critical to the page's core functionality.***
- ***Red (non-critical): Styles that apply to content not immediately visible; code not being used in page's core functionality.***

***How to eliminate render-blocking scripts?*** 

Once you've identified critical code, move that code from the render-blocking URL to an inline script tag in your HTML page. When the page loads, it will have what it needs to handle the page's core functionality.

If there's code in a render-blocking URL that's not critical, you can keep it in the URL, and then mark the URL with async or defer attributes .

Code that isn't being used at all should be removed .

***How to eliminate render-blocking stylesheets ?***

Similar to inlining code in a <script> tag, inline critical styles required for the first paint inside a <style> block at the head of the HTML page. Then load the rest of the styles asynchronously using the preload link .

Consider automating the process of extracting and inlining "Above the Fold" CSS using the Critical tool.

Another approach to eliminating render-blocking styles is to split up those styles into different files, organized by media query. Then add a media attribute to each stylesheet link. When loading a page, the browser only blocks the first paint to retrieve the stylesheets that match the user's device.

Finally, you'll want to minify your CSS to remove any extra whitespace or characters . This ensures that you're sending the smallest possible bundle to your users.
  
  
[Learn More](https://web.dev/render-blocking-resources/?utm_source=lighthouse&utm_medium=lr)
