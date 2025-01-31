# Cloud People

## Modern Monorepo for Cloud People Project

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[//]: # '[![Contributors][contributors-shield]][contributors-url]'
[//]: # '[![Forks][forks-shield]][forks-url]'
[//]: # '[![Stargazers][stars-shield]][stars-url]'

[![Issues][issues-shield]][issues-url] [![MIT License][license-shield]][license-url]

[//]: # '[![LinkedIn][linkedin-shield]][linkedin-url]'

<!-- PROJECT LOGO -->

[//]: # '<br />'
[//]: # '<div align="center">'
[//]: # '  <a href="https://github.com/othneildrew/Best-README-Template">'
[//]: # '    <img src="images/logo.png" alt="Logo" width="80" height="80">'
[//]: # '  </a>'
[//]: #
[//]: # '<h3 align="center">Best-README-Template</h3>'
[//]: #
[//]: # '  <p align="center">'
[//]: # '    An awesome README template to jumpstart your projects!'
[//]: # '    <br />'
[//]: # '    <a href="https://github.com/othneildrew/Best-README-Template"><strong>Explore the docs »</strong></a>'
[//]: # '    <br />'
[//]: # '    <br />'
[//]: # '    <a href="https://github.com/othneildrew/Best-README-Template">View Demo</a>'
[//]: # '    ·'
[//]: # '    <a href="https://github.com/othneildrew/Best-README-Template/issues">Report Bug</a>'
[//]: # '    ·'
[//]: # '    <a href="https://github.com/othneildrew/Best-README-Template/issues">Request Feature</a>'
[//]: # '  </p>'
[//]: # '</div>'

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

Cloud People is a modern web application built using a monorepo architecture. This structure allows us to maintain multiple related packages and applications in a single repository while sharing code and dependencies efficiently.

### Built With

* [Next.js](https://nextjs.org/) - React framework for the web application
* [Turborepo](https://turbo.build/repo) - High-performance build system for JavaScript/TypeScript monorepos
* [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager
* [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
* [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later)
* [pnpm](https://pnpm.io/) (v9.15.4 or later)
```bash
npm install -g pnpm
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/m0nq/cloud-people.git
cd cloud-people
```

2. Install dependencies
```bash
pnpm install
```

## Project Structure

The monorepo is organized into the following workspaces:

```
cloud-people/
├── apps/
│   ├── web/          # Next.js web application
│   └── server/       # Backend server
├── packages/         # Shared packages
├── docs/            # Documentation
└── turbo.json       # Turborepo configuration
```

## Usage

Development:
```bash
# Run all applications in development mode
pnpm dev

# Run specific applications
pnpm app:dev      # Run web app only
pnpm server:dev   # Run server only
```

Building:
```bash
# Build all applications
pnpm build

# Run all applications in production mode
pnpm start
```

Other Commands:
```bash
pnpm lint        # Run linting
pnpm test        # Run tests
```

## Contributing

We welcome contributions to Cloud People! Please note that we have branch protection rules in place to maintain code quality:

- All changes must be made through Pull Requests
- Requires a reviewers approvals
- All status checks must pass

For detailed contribution guidelines and branch protection rules, please see our [Contributing Guide](docs/CONTRIBUTING.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

[//]: # 'Your Name - [@your_twitter](https://twitter.com/your_username) - email@example.com'

LinkedIn:
[![Linkedin Badge](https://img.shields.io/badge/-Monk%20Wellington-blue?style=flat&logo=Linkedin&logoColor=white)](https://linked.com/in/monkwellington)  
Project Link: [https://github.com/m0nq/cloud-people](https://github.com/m0nq/cloud-people)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

[//]: # "Use this space to list resources you find helpful and would like to give credit to. I've included a few of my favorites"
[//]: # 'to kick things off!'
[//]: # '* [Choose an Open Source License](https://choosealicense.com)'
[//]: # '* [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)'
[//]: # "* [Malven's Flexbox Cheatsheet](https://flexbox.malven.co/)"
[//]: # "* [Malven's Grid Cheatsheet](https://grid.malven.co/)"

- [Img Shields](https://shields.io)
- [GitHub Pages](https://pages.github.com)
- [Font Awesome](https://fontawesome.com)
- [React Icons](https://react-icons.github.io/react-icons/search)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/m0nq/cloud-people/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=for-the-badge
[forks-url]: https://github.com/m0nq/cloud-people/forks
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/m0nq/cloud-people/graphs/stargazers
[issues-shield]: https://img.shields.io/github/issues/m0nq/cloud-people.svg?style=for-the-badge
[issues-url]: https://github.com/m0nq/cloud-people/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/m0nq/cloud-people/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/monkwellington
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind-20232A?style=for-the-badge&logo=tailwindcss&logoColor=61DAFB
[Tailwind-url]: https://tailwindcss.com/
