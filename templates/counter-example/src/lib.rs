#![no_std]

pub fn init() -> u64 {
    0
}

pub fn increment(current: u64, amount: u64) -> u64 {
    current.saturating_add(amount)
}

pub fn read(current: u64) -> u64 {
    current
}
