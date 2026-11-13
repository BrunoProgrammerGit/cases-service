<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Docker Compose

Copia `.env.example` a `.env` y ajusta los valores para tu entorno. En Compose,
`SERVICE_HOST` debe ser el nombre del contenedor (`casos-service`) para que el
registro anuncie una dirección resoluble dentro de la red.

```bash
docker compose up --build
```

La aplicación queda disponible dentro de la red de Compose en el puerto
`8082`. El gateway puede usar `http://casos-service:8082`; sus rutas públicas
incluyen `GET /casos/cases`, mientras que el servicio expone `/health` y
`/docs`.

`AdminGuard` acepta `x-roles` porque el API Gateway debe reescribir ese
encabezado después de autenticar la solicitud. No se debe exponer este
servicio directamente a clientes no confiables.

## Contrato de casos y recursos visuales

Los casos se almacenan en MongoDB como documentos con tablero, personajes,
pistas y demás datos relacionados embebidos. `GET /cases/:id` devuelve el
detalle público (dimensiones, casillas, personajes, pistas y referencias
visuales); `GET /cases` solo devuelve resúmenes. El gateway expone esas rutas
como `/casos/cases` y `/casos/cases/:id` mediante `StripPrefix`.

El tablero usa coordenadas enteras base cero desde la esquina superior
izquierda, una casilla por coordenada, y dimensiones máximas de 20 × 20.
`occupable` es independiente de los visuales: un obstáculo no cambia ese flag.
Los campos `visuals.floorId`, `cells[].visual.floorId`,
`cells[].visual.obstacleId` y `characters[].visualId` aceptan solo IDs del
catálogo `data/case_visual_catalog.gd` del cliente; MongoDB nunca almacena
imágenes, URLs ni rutas `res://`. El piso general predeterminado es
`floor.grass.plain`; el fondo predeterminado es `null`. Los casos semilla no
asignan fondos porque el cliente aún no incluye imágenes de fondo.

Los detalles públicos no incluyen `solution` ni `hints`; las pistas se sirven
por `/cases/:id/hints` y la solución solo se usa en la validación del caso.
Los documentos anteriores sin referencias visuales siguen usando los valores
predeterminados del mapper, sin requerir un backfill.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Contrato del modelo de casos

Consulta [`docs/case-domain.md`](docs/case-domain.md) para la estructura JSON,
compatibilidad con casos antiguos, coordenadas, habitaciones, objetos, paredes,
pistas y validaciones del dominio. El contrato visual opcional se mantiene en
`death-doku/docs/case-visual-assets.md` como referencia del cliente.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
