Artwork(GIF) --> Video
======

Using video formats for animated content
----------------------

**Why you should replace animated GIFs with video ?**

Large GIFs are inefficient for delivering animated content. By converting them to videos, you can save big on users' bandwidth. Consider using MPEG4/WebM videos for animations and PNG/WebP for static images instead of GIF to save network bytes.

<img width="708" alt="image" src="https://user-images.githubusercontent.com/75945709/174280188-2155dcb7-11f3-43e1-a96b-05f0aa211c91.png">


**Creating MPEG videos**

There are a number of ways of converting GIFs to video. [FFmpeg](https://ffmpeg.org/) is the tool used in this guide. To use FFmpeg to convert the GIF, my-animation.gif to an MP4 video, run the following command in your console:

```
ffmpeg -i my-animation.gif my-animation.mp4
```

It instructs FFmpeg to take my-animation.gif as the input, signified by the -i flag, and convert it to a video called my-animation.mp4.


**Creating WEBM Videos**

WebM videos are much smaller than MP4 videos, but not all browsers support WebM , so it makes sense to generate both.

To use FFmpeg to convert my-animation.gif to a WebM video, run the following command in your console:

```
ffmpeg -i my-animation.gif -c vp9 -b:v 0 -crf 41 my-animation.webm
```

**Replacing the GIF image with a video**

Animated GIFs have three key traits that a video needs to replicate:

-Play automatically.
-Loop continuously (usually, but it is possible to prevent looping).
-silent.

Luckily, you can recreate these behaviors using the <video> element.

  
```
<video autoplay loop muted playsinline>
  <source src="my-animation.webm" type="video/webm">
  <source src="my-animation.mp4" type="video/mp4">
</video>
  ```


[Learn More](https://web.dev/efficient-animated-content/?utm_source=lighthouse&utm_medium=lr#why-you-should-replace-animated-gifs-with-video)


