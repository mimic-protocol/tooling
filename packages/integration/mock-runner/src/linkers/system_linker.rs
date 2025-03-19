use anyhow::Result;
use serde_json::Value;
use wasmtime::{Caller, Linker};

use crate::helpers::web_assembly;

const MODULE: &str = "env";

pub fn link(linker: &mut Linker<()>, inputs: &Value) -> Result<()> {
    let requested_calls = inputs
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n.as_str().unwrap());

    for call in requested_calls {
        match call {
            "abort" => {
                linker.func_wrap(MODULE, call, abort)?;
            }
            s => todo!("{s}"),
        }
    }
    Ok(())
}

fn abort(
    mut caller: Caller<'_, ()>,
    msg_ptr: i32,
    file_ptr: i32,
    line: i32,
    column: i32,
) -> Result<()> {
    let msg = web_assembly::read_string_from_memory(&mut caller, msg_ptr)?;
    let file = web_assembly::read_string_from_memory(&mut caller, file_ptr)?;
    panic!(
        "abort: {} in {} at line {}, column {}",
        msg, file, line, column
    );
}
