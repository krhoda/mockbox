## Mockbox
### Simple CRUD FileServer In Rocket with CRA front-end:
(Assumes NPM (node.js) + Rust tool chains)

To Run, clone the repo, `cd` in, and then:
```
$ cd server
```
If you're not using Rust nightly,
```
$ rustup override set nightly
```
then either way:
```
$ cargo run
```
And the rocket server will run on `localhost:8000`
Open another terminal, re-enter the repo's directory, then:
```
$ cd ui
$ npm i
$ npm run start
```
And now the world's most minimalist Dropbox UI will run on `localhost:3000`.
