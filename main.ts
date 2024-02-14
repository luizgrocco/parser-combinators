import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts";

// Result
type Result<T, Error> =
  | { ok: true; value: T }
  | { ok: false; err: Error };

// Parser Combinators
type ParseInput = string;
type ParseResult<T> = [Result<T, Error>, ParseInput];
export type Parser<T> = (input: ParseInput) => ParseResult<T>;

const ok = <T>(
  result: T,
  inputAfterOk: ParseInput,
): ParseResult<T> => [{ ok: true, value: result }, inputAfterOk];

const fail = <T = never>(
  inputAfterFail: ParseInput,
  errMsg = "failed without a message",
): ParseResult<T> => [
  { ok: false, err: new Error(errMsg) },
  inputAfterFail,
];

type Char = string;

const satisfy =
  (testFn: (c: Char) => boolean): Parser<Char> => (input: ParseInput) =>
    input.length > 0 && testFn(input[0])
      ? ok(input[0], input.slice(1))
      : fail(input, `failed to parse ${input[0]}`);

Deno.test(function satisfyTest() {
  const satisfy_L_u_i_z = satisfy(
    (c) => ["L", "u", "i", "z"].includes(c),
  );

  // Passing cases
  assertEquals(satisfy_L_u_i_z("L"), ok("L", ""));
  assertEquals(satisfy_L_u_i_z("u"), ok("u", ""));
  assertEquals(satisfy_L_u_i_z("i"), ok("i", ""));
  // Failing cases
  assertEquals(satisfy_L_u_i_z("b"), fail("b"));
  assertEquals(satisfy_L_u_i_z("c"), fail("c"));
  assertEquals(satisfy_L_u_i_z("d"), fail("d"));
});

// const char = (c: Char): Parser<Char> => satisfy((input) => input === c);
const char = <const T>(c: T): Parser<T> => (input: ParseInput) =>
  input.length > 0 && input[0] === c ? ok(c, input.slice(1)) : fail(
    input,
    input.length === 0
      ? `failed to parse the char ${c} on an empty input`
      : `failed to parse the char ${c} on input ${input}`,
  );

Deno.test(function charTest() {
  const char_a = char("a");
  const char_l = char("l");
  const char_Z = char("Z");

  // Passing cases
  assertEquals(char_a("abc"), ok("a", "bc"));
  assertEquals(char_l("luiz"), ok("l", "uiz"));
  assertEquals(char_Z("Zillow"), ok("Z", "illow"));
  // Failing cases
  assertEquals(char_l("Luiz"), fail("Luiz"));
  assertEquals(char_Z("z"), fail("z"));
  assertEquals(char_a("A"), fail("A"));
});

const EMPTY_STRING = "";
type EmptyString = typeof EMPTY_STRING;
const empty: Parser<EmptyString> = (
  input: ParseInput,
) => [{ ok: true, value: EMPTY_STRING }, input];

Deno.test(function emptyTest() {
  // Passing cases
  assertEquals(empty("abc"), ok("", "abc"));
  assertEquals(empty("luiz"), ok("", "luiz"));
  assertEquals(empty("Zillow"), ok("", "Zillow"));
  // Failing cases
  // Should never fail
});

const literal =
  <T extends string>(literal: T): Parser<T> => (input: ParseInput) =>
    input.startsWith(literal)
      ? ok(literal, input.slice(literal.length))
      : fail(input, `failed to parse literal ${literal} on input ${input}`);

Deno.test(function literalTest() {
  const literal_beto = literal("beto");
  const literal_a = literal("a");
  const literal_longlonglongstring = literal("longlonglongstring");
  const literal_123 = literal("123");

  // Passing cases
  assertEquals(literal_beto("beto"), ok("beto", ""));
  assertEquals(literal_a("abc"), ok("a", "bc"));
  assertEquals(
    literal_longlonglongstring("longlonglongstring123"),
    ok("longlonglongstring", "123"),
  );
  assertEquals(literal_123("123456"), ok("123", "456"));

  // Failing cases
  assertEquals(literal_beto("beta"), fail("beta"));
  assertEquals(literal_a("A"), fail("A"));
  assertEquals(
    literal_longlonglongstring("longextralonglongstring"),
    fail("longextralonglongstring", ""),
  );
  assertEquals(literal_123("124"), fail("124"));
});

const map = <T, R>(
  parser: Parser<T>,
  fn: (arg: T) => R,
): Parser<R> =>
(input: ParseInput) => {
  const [result, remainder] = parser(input);
  return result.ok ? ok(fn(result.value), remainder) : [result, remainder];
};

Deno.test(function mapTest() {
  const charMap = map(char("a"), (char) => ({
    char,
  }));

  assertEquals(charMap("a"), ok({ char: "a" }, ""));
});

const or =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<T | R> =>
  (input: ParseInput) => {
    const [firstResult, firstRemainder] = firstParser(input);
    if (firstResult.ok) return [firstResult, firstRemainder];
    return secondParser(input);
  };

Deno.test(function orTest() {
  const or_a_b = or(char("a"), char("b"));
  const or_zi_ll = or(
    and(char("z"), char("i")),
    and(char("l"), char("l")),
  );

  // Passing cases
  assertEquals(or_a_b("a"), ok("a", ""));
  assertEquals(or_a_b("b"), ok("b", ""));
  assertEquals(or_zi_ll("zi"), ok(["z", "i"], ""));
  assertEquals(or_zi_ll("ll"), ok(["l", "l"], ""));
  // Failing cases
  assertEquals(or_a_b("c"), fail("c"));
  assertEquals(or_a_b("d"), fail("d"));
  assertEquals(or_zi_ll("iz"), fail("iz"));
  assertEquals(or_zi_ll("zz"), fail("zz"));
});

const any =
  // deno-lint-ignore no-explicit-any
  <U, T extends any[]>(
    firstParser: Parser<U>,
    ...parsers: { [K in keyof T]: Parser<T[K]> }
  ): Parser<U | T[number]> =>
  (input: ParseInput) => {
    let [result, remainder] = firstParser(input);

    if (!result.ok) {
      for (const parser of parsers) {
        [result, remainder] = parser(input);
        if (result.ok) return [result, remainder];
      }
    }

    return [result, remainder];
  };

Deno.test(function anyTest() {
  const any_a_b_c = any(char("a"), char("b"), char("c"));

  // Passing cases
  assertEquals(any_a_b_c("a"), ok("a", ""));
  assertEquals(any_a_b_c("apple"), ok("a", "pple"));
  assertEquals(any_a_b_c("b"), ok("b", ""));
  assertEquals(any_a_b_c("big"), ok("b", "ig"));
  assertEquals(any_a_b_c("c"), ok("c", ""));
  assertEquals(any_a_b_c("casa"), ok("c", "asa"));
  // Failing cases
  assertEquals(any_a_b_c("d"), fail("d"));
  assertEquals(any_a_b_c("dado"), fail("dado"));
  assertEquals(any_a_b_c("Abc"), fail("Abc"));
  assertEquals(any_a_b_c("Bac"), fail("Bac"));
  assertEquals(any_a_b_c("Cab"), fail("Cab"));
  assertEquals(any_a_b_c("ABC"), fail("ABC"));
});

const and =
  <T, R>(firstParser: Parser<T>, secondParser: Parser<R>): Parser<[T, R]> =>
  (input: ParseInput) => {
    const [firstResult, firstRemainder] = firstParser(input);

    if (!firstResult.ok) return [firstResult, input];

    const [secondResult, remainder] = secondParser(firstRemainder);
    return secondResult.ok
      ? ok([firstResult.value, secondResult.value], remainder)
      : [secondResult, input];
  };

Deno.test(function andTest() {
  const and_a_b = and(char("a"), char("b"));
  const and_l_u = and(char("l"), char("u"));
  const and_zi_ll = and(and(char("z"), char("i")), and(char("l"), char("l")));

  // Passing cases
  assertEquals(and_a_b("ab"), ok(["a", "b"], ""));
  assertEquals(and_l_u("luiz"), ok(["l", "u"], "iz"));
  assertEquals(and_zi_ll("zillow"), ok([["z", "i"], ["l", "l"]], "ow"));
  // Failing cases
  assertEquals(and_a_b("ac"), fail("ac"));
  assertEquals(and_l_u("zu"), fail("zu"));
  assertEquals(and_zi_ll("zilkow"), fail("zilkow"));
});

// deno-lint-ignore no-explicit-any
const all = <U, T extends any[]>(
  firstParser: Parser<U>,
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<[U, ...T]> =>
  parsers.reduce(
    (acc, parser) =>
      map(and(acc, parser), ([results, result]) => [...results, result]),
    map(firstParser, (result) => [result]),
  );

Deno.test(function allTest() {
  const all_l_u_i_z = all(char("l"), char("u"), char("i"), char("z"));
  const all_s_o_r_a_i_or_y_a = all(
    char("s"),
    char("o"),
    char("r"),
    char("a"),
    or(char("y"), char("i")),
    char("a"),
  );
  const all_b_e_t_o = all(char("b"), char("e"), char("t"), char("o"));

  // Passing cases
  assertEquals(all_l_u_i_z("luiz"), ok(["l", "u", "i", "z"], ""));
  assertEquals(
    all_s_o_r_a_i_or_y_a("soraia"),
    ok(["s", "o", "r", "a", "i", "a"], ""),
  );
  assertEquals(
    all_s_o_r_a_i_or_y_a("soraya"),
    ok(["s", "o", "r", "a", "y", "a"], ""),
  );
  assertEquals(all_b_e_t_o("beto"), ok(["b", "e", "t", "o"], ""));
  // Failing cases
  assertEquals(all_l_u_i_z("luis"), fail("luis"));
  assertEquals(all_l_u_i_z("ziul"), fail("ziul"));
  assertEquals(all_b_e_t_o("beta"), fail("beta"));
});

// const many = <T>(parser: Parser<T>): Parser<T[]> => (input: ParseInput) => {
//   let remainingInput = input;
//   const accResult = [];
//   let [result, remainder] = parser(remainingInput);

//   if (result.ok) {
//     while (result.ok && remainder.length !== remainingInput.length) {
//       accResult.push(result.value);
//       remainingInput = remainder;
//       [result, remainder] = parser(remainingInput);
//     }
//     return ok(accResult, remainingInput);
//   }

//   return [result, remainder];
// };

const many = <T>(parser: Parser<T>): Parser<T[]> => (input: ParseInput) => {
  let [result, remainder] = parser(input);

  if (!result.ok) return [result, remainder];

  let inputRemainder = remainder;
  const resultAcc: T[] = [];
  do {
    resultAcc.push(result.value);
    inputRemainder = remainder;
    [result, remainder] = parser(inputRemainder);
  } while (result.ok && inputRemainder.length !== remainder.length);

  return ok(resultAcc, inputRemainder);
};

Deno.test(function manyTest() {
  const many_lu = many(and(char("l"), char("u")));
  const many_a = many(char("a"));
  const many_optional_a = many(optional(char("a")));
  const many_empty = many(empty);

  // Passing cases
  assertEquals(many_lu("lulu"), ok([["l", "u"], ["l", "u"]], ""));
  assertEquals(many_lu("luluana"), ok([["l", "u"], ["l", "u"]], "ana"));
  assertEquals(many_a("aaa"), ok(["a", "a", "a"], ""));
  assertEquals(many_a("aaaAaaa"), ok(["a", "a", "a"], "Aaaa"));
  assertEquals(many_optional_a("aa"), ok(["a", "a"], ""));
  assertEquals(many_empty(""), ok<EmptyString[]>([""], ""));
  // Failing cases
  assertEquals(many_lu("lUlu"), fail("lUlu"));
  assertEquals(many_lu("Lulu"), fail("Lulu"));
  assertEquals(many_a("Aaa"), fail("Aaa"));
  assertEquals(many_a(""), fail(""));
});

const optional = <T>(parser: Parser<T>) => or(parser, empty);

Deno.test(function optionalTest() {
  const optional_l = optional(char("l"));
  const optional_plus = optional(char("+"));
  const optional_many_lu = optional(many(literal("lu")));

  // Passing cases
  assertEquals(optional_l("k"), ok("", "k"));
  assertEquals(optional_plus("1"), ok("", "1"));
  assertEquals(optional_plus("+1"), ok("+", "1"));
  assertEquals(optional_many_lu("lalala"), ok<EmptyString>("", "lalala"));
  assertEquals(optional_many_lu("lululu"), ok<"lu"[]>(["lu", "lu", "lu"], ""));
  // Failing cases
  // Should never fail
});

// const not = <T>(parser: Parser<T>): Parser<T> => (input: ParseInput) {
//   const [result] = parser(input)
// }
const precededBy = <T, R>(
  precedingParser: Parser<T>,
  parser: Parser<R>,
): Parser<R> => map(and(precedingParser, parser), ([, result]) => result);

Deno.test(function precededTest() {
  // Passing cases
  assertEquals(precededBy(char(","), char("a"))(",a"), ok("a", ""));
  assertEquals(
    precededBy(literal("use"), literal("State"))("useState"),
    ok("State", ""),
  );
  assertEquals(
    precededBy(char("<"), literal("div"))("<div />"),
    ok("div", " />"),
  );

  // Failing cases
  assertEquals(precededBy(char(","), char("a"))(".a"), fail(".a"));
  assertEquals(
    precededBy(literal("use"), literal("State"))("usarState"),
    fail("usarState"),
  );
  assertEquals(
    precededBy(char("<"), literal("div"))("div />"),
    fail("div />"),
  );
});

const succeededBy = <T, R>(
  succeedingParser: Parser<R>,
  parser: Parser<T>,
): Parser<T> => map(and(parser, succeedingParser), ([result]) => result);

Deno.test(function succeededTest() {
});

// const enclosedBy = <T, R, Q>(precedingParser: Parser<T>, parser: Parser<R>, succeedingParser<Q>): Parser<R> => {}
