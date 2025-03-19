use serde::{
    de::{self, SeqAccess, Visitor},
    forward_to_deserialize_any, Deserialize, Deserializer,
};

struct GenericDeserializer<'de> {
    input: &'de str,
}

impl<'de> GenericDeserializer<'de> {
    fn new(input: &'de str) -> Self {
        Self { input }
    }
}

struct StructSeqAccess<'de> {
    parts: std::vec::IntoIter<&'de str>,
}

impl<'de> SeqAccess<'de> for StructSeqAccess<'de> {
    type Error = de::value::Error;

    fn next_element_seed<T>(&mut self, seed: T) -> Result<Option<T::Value>, Self::Error>
    where
        T: de::DeserializeSeed<'de>,
    {
        if let Some(part) = self.parts.next() {
            let mut de = GenericDeserializer::new(part);
            seed.deserialize(&mut de).map(Some)
        } else {
            Ok(None)
        }
    }
}

impl<'de> Deserializer<'de> for &mut GenericDeserializer<'de> {
    type Error = de::value::Error;

    fn deserialize_any<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>,
    {
        if let Ok(n) = self.input.parse::<i64>() {
            return visitor.visit_i64(n);
        }
        if let Ok(b) = self.input.parse::<bool>() {
            return visitor.visit_bool(b);
        }
        visitor.visit_str(self.input)
    }

    fn deserialize_string<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>,
    {
        let s = self.input.to_owned();
        if let Some(big_int) = s.strip_prefix("BigInt(").and_then(|s| s.strip_suffix(")")) {
            visitor.visit_string(big_int.to_owned())
        } else {
            visitor.visit_string(s)
        }
    }

    fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>,
    {
        if self.input.is_empty() {
            visitor.visit_none()
        } else {
            visitor.visit_some(self)
        }
    }

    fn deserialize_struct<V>(
        self,
        _name: &'static str,
        _fields: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>,
    {
        let parts: Vec<&'de str> = self.input.split(',').collect();
        let seq = StructSeqAccess {
            parts: parts.into_iter(),
        };
        visitor.visit_seq(seq)
    }

    forward_to_deserialize_any! {
        str enum bool i8 i16 i64 i32 u8 u16 u32 u64 f32 f64 char bytes byte_buf unit unit_struct newtype_struct seq tuple tuple_struct map identifier ignored_any
    }
}

pub fn from_str<'a, T>(s: &'a str) -> Result<T, de::value::Error>
where
    T: Deserialize<'a>,
{
    let mut deserializer = GenericDeserializer::new(s);
    T::deserialize(&mut deserializer)
}
