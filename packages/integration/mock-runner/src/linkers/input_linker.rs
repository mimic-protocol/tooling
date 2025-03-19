use anyhow::{Ok, Result};
use serde::Deserialize;
use serde_json::Value;
use wasmtime::{Global, GlobalType, Linker, Mutability, Store, Val, ValType};

pub fn link(linker: &mut Linker<()>, store: &mut Store<()>, inputs: &Value) -> Result<()> {
    for (key, value) in inputs.as_object().unwrap() {
        let ty = GlobalType::new(ValType::I32, Mutability::Const);
        let item = Global::new(&mut *store, ty, Val::I32(Deserialize::deserialize(value)?))?;
        linker.define(&mut *store, "index", format!("input.{key}").as_str(), item)?;
    }
    Ok(())
}
