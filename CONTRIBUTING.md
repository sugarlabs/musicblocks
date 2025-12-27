## CONTRIBUTING GUIDELINES

## <a name="HOW_TO_SET_UP_A_LOCAL_SERVER"></a>How to set up a _local server_

Music Blocks is written using native browser technologies. The bulk of
the functionality is in vanilla _JavaScript_. Therefore, most of
the functionality can be accessed by launching the
[index.html](./index.html) file in the browser using
`file:///absolute/path/to/index.html`.

However, doing so, some functionality will be unavailable. Therefore, it is
best to launch a _local web server_ from the directory of Music
Blocks.

1. [Download](https://github.com/sugarlabs/musicblocks/archive/master.zip)
Music Blocks, or clone (`https://github.com/sugarlabs/musicblocks.git`
for _HTTPS_, or `gh repo clone sugarlabs/musicblocks` for _GitHub
CLI_), on your local machine.

2. In a terminal, `cd` to the directory where you downloaded/cloned
Music Blocks, using `cd path/to/musicblocks/`.

3. After you are in `path/to/musicblocks/` directory, install the dependencies using the following command

    ```bash
    npm install
    ```

4. After cloning the musicblocks repository, you can start a local server using npm

    ```bash
    npm run dev
    ```

5. You should see a message `Serving HTTP on 127.0.0.1 port 3000
(http://127.0.0.1:3000/) ...` since the HTTP Server is set to start
listening on port 3000.

6. Open your favorite browser and visit `localhost:3000` or `127.0.0.1:3000`.

**NOTE:** _Use `ctrl + c` or `cmd + c` to quit the HTTP Server to avoid
`socket.error:[Errno 48]`_.



## Local Setup with Docker

## Prerequisites

Before you begin, ensure you have Docker installed on your machine. You can download and install Docker from the [official Docker website](https://www.docker.com/get-started).

## Installation

1. Clone the Music Blocks repository to your local machine:

   ```bash
   git clone https://github.com/sugarlabs/musicblocks.git
   ```

2. Navigate to the cloned repository:

   ```bash
   cd musicblocks
   ```

3. Build the Docker image using the provided Dockerfile:

   ```bash
   docker build -t musicblocks .
   ```
## Running Music Blocks

1. Run the Docker container using the built image:

   ```bash
   docker run -p 3000:3000 musicblocks
   ```

   This command will start a Docker container running Music Blocks and expose it on port 3000.

2. Access Music Blocks in your web browser by navigating to `http://localhost:3000`.

## Stopping the Docker container

To stop the Docker container, use `Ctrl + C` in your terminal. This will stop the container and free up the port it was using.

## Additional Notes

- Make sure to replace `musicblocks` with the appropriate image name if you have tagged the Docker image differently.
- You can customize the port mapping (`-p`) if you prefer to use a different port for accessing Music Blocks.

---

This documentation provides a basic setup for running Music Blocks locally using Docker. Feel free to customize it further based on your specific requirements and environment.
## <a name="USING_MUSIC_BLOCKS"></a>Using Music Blocks

Once Music Blocks is running, you'll want suggestions on how to use
it. Follow [Using Music Blocks](./Docs/documentation/README.md) and [Music
Blocks Guide](./Docs/guide/README.md).

For Scratch and Snap users, you may want to look at [Music Blocks for
Snap Users](./Music_Blocks_for_Snap_Users.md).

Looking for a block? Find it in the
[Palette Tables](./Docs/guide/README.md#6-appendix).



## <a name="CONTRIBUTING"></a>Contributing

Please consider contributing to the project, with your ideas, your
music, your lesson plans, your artwork, and your code.

### Special Notes

Music Blocks is being built from the ground-up, to address several
architectural problems with this run. Since Music Blocks is a fork of
Turtle Blocks JS, musical functionality was added on top of it.
However, music is fundamental to Music Blocks. Besides, the Turtle
Blocks JS started initially with handful of features and was written
without a complex architecture. As Music Blocks was built on top of
that, it became incrementally complex, but the architecture remained
simple, thus resulting in a monolith. Also, the functionality is
tightly coupled with the interface and native client API (Web API).

Keeping these problems in mind, we have considered a foundational
rebuild that will address all these issues, whilst adding buffers for
future additions. Additionally, we will make use of a more elegant tech-stack to
develop and maintain this project given its scale. After the core is
built, we'll be porting features from this application to it.

Refer to the repository
[**sugarlabs/musicblocks-v4**](https://github.com/sugarlabs/musicblocks-v4)
for more information about the new project &mdash; _Music Blocks 4.0_.

### Tech Stack

Music Blocks is a Web Application and is written using browser
technologies &mdash; `HTML`, `CSS` (`SCSS`), `JavaScript`, `SVG`, etc.

If you're just getting started with development, you may refer to the
following resources:

- [HTML tutorial - w3schools.com](https://www.w3schools.com/html/default.asp)
- [HTML reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [CSS tutorial - w3schools.com](https://www.w3schools.com/css/default.asp)
- [CSS reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [JavaScript tutorial - w3schools.com](https://www.w3schools.com/js/default.asp)
- [JavaScript reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Programmers, please follow these general [guidelines for
contributions](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md).

### New Contributors

Use the
[discussions](https://github.com/sugarlabs/musicblocks/discussions)
tab at the top of the repository to:

- Ask questions you’re wondering about.
- Share ideas.
- Engage with other community members.

Feel free. But, please don't spam :p.

### Keep in Mind

1. Your contributions need not necessarily have to address any
discovered issue. If you encounter any, feel free to add a fix through
a PR, or create a new issue ticket.

2. Use [labels](https://github.com/sugarlabs/musicblocks/labels) on
your issues and PRs.

3. Please do not spam with many PRs consisting of little changes.

4. If you are addressing a bulk change, divide your commits across
multiple PRs, and send them one at a time. The fewer the number of
files addressed per PR, the better.

5. Communicate effectively. Go straight to the point. You don't need
to address anyone using '_sir_'. Don't write unnecessary comments;
don't be over-apologetic. There is no superiority hierarchy. Every
single contribution is welcome, as long as it doesn't spam or distract
the flow.

6. Write useful, brief commit messages. Add commit descriptions if
necessary. PR name should speak about what it is addressing and not
the issue. In case a PR fixes an issue, use `fixes #ticketno` or
`closes #ticketno` in the PR's comment. Briefly explain what your PR
is doing.

7. Always test your changes extensively before creating a PR. There's
no sense in merging broken code. If a PR is a _work in progress
(WIP)_, convert it to draft. It'll let the maintainers know it isn't
ready for merging.

8. Read and revise the concepts about programming constructs you're
dealing with. You must be clear about the behavior of the language or
compiler/transpiler. See [JavaScript
docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

9. If you have a question, do a _web search_ first. If you don't find
any satisfactory answer, then ask it in a comment. If it is a general
question about Music Blocks, please use the new
[discussions](https://github.com/sugarlabs/musicblocks/discussions)
tab on top the the repository, or the _Sugar-dev Devel
<[sugar-devel@lists.sugarlabs.org](mailto:sugar-devel@lists.sugarlabs.org)>_
mailing list. Don't ask silly questions (unless you don't know it is
silly ;p) before searching it on the web.

10. Work on things that matter. Follow three milestones: `Port Ready`,
`Migration`, and `Future`.  Those tagged `Port Ready` are
priority. Those tagged with `Migration` will be taken care of during
or after the foundation rebuild. Feel free to participate in the
conversation, adding valuable comments. Those tagged with `Future`
need not be addressed presently.

_Please note there is no need to ask permission to work on an
issue. You should check for pull requests linked to an issue you are
addressing; if there are none, then assume nobody has done
anything. Begin to fix the problem, test, make your commits, push your
commits, then make a pull request. Mention an issue number in the pull
request, but not the commit message. These practices allow the
competition of ideas (Sugar Labs is a meritocracy)._



