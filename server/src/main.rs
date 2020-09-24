#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;

use rocket::http::Method;
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use rocket_contrib::json::{JsonValue};

const FILE_DIR: &str = "./assets";

// HELPERS:
fn make_cors() -> Result<rocket_cors::Cors, rocket_cors::Error> {
    let allowed_origins = AllowedOrigins::all();

    rocket_cors::CorsOptions{
        allowed_origins,
        allowed_methods: vec![Method::Get, Method::Post, Method::Options]
        .into_iter()
        .map(From::from)
        .collect(),
        allowed_headers: AllowedHeaders::all(),
        allow_credentials: true,
        ..Default::default()
    }.to_cors()
}



fn file_to_file_rec(f: std::fs::DirEntry) -> Option<FileRec> {
    match f.file_name().into_string() {
        Ok(name) => {
            let name2 = name.clone();
            let maybe_ext = std::path::Path::new(&name2)
            .extension()
            .and_then(std::ffi::OsStr::to_str);

            match maybe_ext {
                Some(ext) => {
                    Some(FileRec{
                        name: name,
                        ext: String::from(ext),
                    })
                }
                _ => None
            }
        },
        _ => None
    }
}

// STRUCTS & TYPES:
#[derive(Serialize, Deserialize)]
struct FileRec {
    name: String,
    ext: String
}

// ROUTES:
#[get("/hello")]
fn hello() -> &'static str {
    "Hello, world"
}

#[get("/files")]
fn list_files() -> Result<JsonValue, std::io::Error> {
    let entries = std::fs::read_dir(FILE_DIR)?
    .map(|res| {
        res.map(|entry| file_to_file_rec(entry))
    })
    .filter(|maybe_rec| {
        match maybe_rec {
            Ok(_) => true,
            _ => false
        }
    })
    .collect::<Result<Vec<_>, std::io::Error>>()?;

    Ok(json!(entries))
}

fn main() {
    match make_cors() {
        Ok(cors) => {
            rocket::ignite()
            .mount("/", routes![hello, list_files])
            .attach(cors)
            .launch();
        },
        Err(err) => {
            panic!("Failed in CORS creation, err: {}", err);
        }
    }
}