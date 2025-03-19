mod helpers;
mod linkers;
use anyhow::{anyhow, Ok, Result};
use linkers::{environment_linker, input_linker, system_linker};
use serde_json::Value;
use std::{env, fs};
use wasmtime::{Config, Engine, Linker, Module, Store};

#[tokio::main]
async fn main() -> Result<()> {
    let (wasm, environment, manifest) = load_files()?;

    let mut config = Config::new();
    config.async_support(true);

    let engine = Engine::new(&config)?;
    let mut store = Store::new(&engine, ());
    let mut linker = Linker::new(&engine);

    if let Some(inputs) = manifest.get("inputs") {
        input_linker::link(&mut linker, &mut store, inputs)?;
    }

    environment_linker::link(&mut linker, &environment)?;
    system_linker::link(&mut linker, &serde_json::json!(["abort"]))?;

    let module = Module::new(&engine, &wasm)?;
    let instance = linker.instantiate_async(&mut store, &module).await?;
    let main_function = instance.get_typed_func::<(), ()>(&mut store, "main")?;

    main_function.call_async(&mut store, ()).await?;

    println!("Finished executing WASM!");
    Ok(())
}

fn load_files() -> Result<(Vec<u8>, Value, Value)> {
    let args: Vec<String> = env::args().collect();
    if args.len() != 4 {
        return Err(anyhow!("Must provide 3 paths"));
    }

    let (wasm_path, environment_path, manifest_path) = (&args[1], &args[2], &args[3]);

    let wasm = fs::read(wasm_path).map_err(|e| anyhow!("Failed to read {}: {}", wasm_path, e))?;
    let environment = get_json(environment_path)?;
    let manifest = get_json(manifest_path)?;
    Ok((wasm, environment, manifest))
}

fn get_json(file: &String) -> Result<Value> {
    let str_file =
        fs::read_to_string(file).map_err(|e| anyhow!("Failed to read {}: {}", file, e))?;
    Ok(serde_json::from_str(&str_file)?)
}
