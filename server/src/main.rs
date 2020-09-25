#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;
#[macro_use]
extern crate serde_derive;

use rocket::http::{Method, Status};
use rocket::response::NamedFile;
use rocket_contrib::json::{Json, JsonValue};
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};

const FILE_DIR: &str = "./assets";

// HELPERS:
fn make_cors() -> Result<rocket_cors::Cors, rocket_cors::Error> {
    let allowed_origins = AllowedOrigins::all();

    rocket_cors::CorsOptions {
        allowed_origins,
        allowed_methods: vec![Method::Delete, Method::Get, Method::Post, Method::Options]
            .into_iter()
            .map(From::from)
            .collect(),
        allowed_headers: AllowedHeaders::all(),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()
}

fn file_to_file_rec(f: std::fs::DirEntry) -> Option<FileRec> {
    match f.file_name().into_string() {
        Ok(name) => {
            let name2 = name.clone();
            let maybe_ext = std::path::Path::new(&name2)
                .extension()
                .and_then(std::ffi::OsStr::to_str);

            match maybe_ext {
                Some(ext) => Some(FileRec {
                    name: name,
                    ext: String::from(ext),
                }),
                _ => None,
            }
        }
        _ => None,
    }
}

// STRUCTS & TYPES:
#[derive(Serialize, Deserialize)]
struct FileRec {
    name: String,
    ext: String,
}

#[derive(Serialize, Deserialize)]
struct FileUp {
    name: String,
    body: String,
}

// ROUTES:
#[get("/hello")]
fn hello() -> &'static str {
    "Hello, world"
}

#[get("/files/<file..>")]
fn download_file(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new(FILE_DIR).join(file)).ok()
}

#[get("/files")]
fn list_files() -> Result<JsonValue, std::io::Error> {
    let entries = std::fs::read_dir(FILE_DIR)?
        .map(|res| res.map(|entry| file_to_file_rec(entry)))
        .filter(|maybe_rec| match maybe_rec {
            Ok(x) => match x {
                Some(_) => true,
                _ => false,
            },
            _ => false,
        })
        .collect::<Result<Vec<_>, std::io::Error>>()?;

    Ok(json!(entries))
}

#[delete("/files/<file_name..>")]
fn delete_file(file_name: PathBuf) -> Result<Status, std::io::Error> {
    std::fs::remove_file(Path::new(FILE_DIR).join(file_name))?;
    Ok(Status::Ok)
}

#[post("/files", format = "application/json", data = "<file_up>")]
fn upload_file(file_up: Json<FileUp>) -> Result<Status, std::io::Error> {
    let maybe_b = base64::decode(&file_up.0.body);

    match maybe_b {
        Ok(b) => {
            let mut next_file = OpenOptions::new()
                .read(true)
                .write(true)
                .create_new(true)
                .open(Path::new(FILE_DIR).join(file_up.0.name))?;

            next_file.write_all(&b)?;

            Ok(Status::Ok)
        }
        _ => {
            Ok(Status::InternalServerError)
        }
    }
}

fn main() {
    match make_cors() {
        Ok(cors) => {
            rocket::ignite()
                .mount("/", routes![hello, download_file, list_files, upload_file, delete_file])
                .attach(cors)
                .launch();
        }
        Err(err) => {
            panic!("Failed in CORS creation, err: {}", err);
        }
    }
}
