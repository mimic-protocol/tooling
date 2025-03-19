use anyhow::{Ok, Result};
use serde::Deserialize;
use serde_json::Value;
use std::{future::Future, time::Duration};
use wasmtime::{Caller, Linker};

use crate::{helpers::web_assembly::read_string_from_memory, linkers::csv_deserializer};

use tokio::time::sleep;

const MODULE: &str = "environment";

pub fn link(linker: &mut Linker<()>, inputs: &Value) -> Result<()> {
    let requested_calls = inputs
        .as_array()
        .unwrap()
        .iter()
        .map(|n| n.as_str().unwrap());

    for call in requested_calls {
        match call {
            "getETHPrice" => linker.func_wrap_async(MODULE, call, get_eth_price)?,
            "_call" => linker.func_wrap(MODULE, call, create_call)?,
            "_swap" => linker.func_wrap(MODULE, call, swap)?,
            "_transfer" => linker.func_wrap(MODULE, call, transfer)?,
            s => todo!("{s}"),
        };
    }
    Ok(())
}

fn get_eth_price(_: Caller<'_, ()>, (): ()) -> Box<dyn Future<Output = Result<i32>> + Send + '_> {
    Box::new(async move {
        println!("Host: getETHPrice() called!");
        sleep(Duration::from_secs(1)).await;
        let price = 42;
        println!("Host: returning ETH price: {}", price);
        Ok(price)
    })
}

fn create_call(mut caller: Caller<'_, ()>, ptr: i32) -> Result<()> {
    let csv_string = read_string_from_memory(&mut caller, ptr)?;
    let params: CallParams = csv_deserializer::from_str(csv_string.as_str())?;
    println!("params = {:#?}", params);
    Ok(())
}

fn swap(mut caller: Caller<'_, ()>, params_ptr: i32) -> Result<()> {
    let csv_string = read_string_from_memory(&mut caller, params_ptr)?;
    let params: SwapParams = csv_deserializer::from_str(csv_string.as_str())?;
    println!("params = {:#?}", params);
    Ok(())
}

fn transfer(mut caller: Caller<'_, ()>, params_ptr: i32) -> Result<()> {
    let csv_string = read_string_from_memory(&mut caller, params_ptr)?;
    let params: TransferParams = csv_deserializer::from_str(csv_string.as_str())?;
    println!("params = {:#?}", params);
    Ok(())
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct CallParams {
    settler: String,
    chain_id: u64,
    target: String,
    fee_token: String,
    fee_amount: String,
    data: Option<String>,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct SwapParams {
    settler: String,
    source_chain_id: u64,
    token_in: String,
    amount_in: String,
    token_out: String,
    min_amount_out: String,
    destination_chain_id: u64,
}

#[allow(dead_code)]
#[derive(Deserialize, Debug)]
struct TransferParams {
    settler: String,
    source_chain_id: u64,
    token: String,
    amount: String,
    recipient: String,
    fee_amount: String,
}
