import { assertEquals } from "https://deno.land/std@0.202.0/assert/assert_equals.ts";
import {
  and,
  any,
  char,
  empty,
  exactly,
  fail,
  integer,
  joinedBy,
  letter,
  literal,
  map,
  natural,
  number,
  optional,
  or,
  precededBy,
  satisfy,
  sequence,
  some,
  spaced,
  succeed,
  succeededBy,
  surroundedBy,
} from "./main.ts";
import { delimitedBy } from "./main.ts";

Deno.test(function satisfyTest() {
  const satisfy_L_u_i_z = satisfy((c) => ["L", "u", "i", "z"].includes(c));

  // Passing cases
  assertEquals(satisfy_L_u_i_z("L"), succeed("L", ""));
  assertEquals(satisfy_L_u_i_z("u"), succeed("u", ""));
  assertEquals(satisfy_L_u_i_z("i"), succeed("i", ""));
  // Failing cases
  assertEquals(satisfy_L_u_i_z("b"), fail("b"));
  assertEquals(satisfy_L_u_i_z("c"), fail("c"));
  assertEquals(satisfy_L_u_i_z("d"), fail("d"));
});

Deno.test(function charTest() {
  const char_a = char("a");
  const char_l = char("l");
  const char_Z = char("Z");

  // Passing cases
  assertEquals(char_a("abc"), succeed("a", "bc"));
  assertEquals(char_l("luiz"), succeed("l", "uiz"));
  assertEquals(char_Z("Zillow"), succeed("Z", "illow"));
  // Failing cases
  assertEquals(char_l("Luiz"), fail("Luiz"));
  assertEquals(char_Z("z"), fail("z"));
  assertEquals(char_a("A"), fail("A"));
});

Deno.test(function letterTest() {
  const letter_a = letter("a");
  const letter_l = letter("l");
  const letter_Z = letter("Z");

  // Passing cases
  assertEquals(letter_a("A"), succeed("a", ""));
  assertEquals(letter_a("abc"), succeed("a", "bc"));
  assertEquals(letter_Z("Zillow"), succeed("z", "illow"));
  assertEquals(letter_Z("zillow"), succeed("z", "illow"));
  assertEquals(letter_l("luiz"), succeed("l", "uiz"));
  assertEquals(letter_l("Luiz"), succeed("l", "uiz"));
  // Failing cases
  assertEquals(letter_a("b"), fail("b"));
  assertEquals(letter_l("a"), fail("a"));
});

Deno.test(function emptyTest() {
  // Passing cases
  assertEquals(empty("abc"), succeed("", "abc"));
  assertEquals(empty("luiz"), succeed("", "luiz"));
  assertEquals(empty("Zillow"), succeed("", "Zillow"));
  // Failing cases
  // Should never fail
});

Deno.test(function literalTest() {
  const literal_beto = literal("beto");
  const literal_a = literal("a");
  const literal_longlonglongstring = literal("longlonglongstring");
  const literal_123 = literal("123");

  // Passing cases
  assertEquals(literal_beto("beto"), succeed("beto", ""));
  assertEquals(literal_a("abc"), succeed("a", "bc"));
  assertEquals(
    literal_longlonglongstring("longlonglongstring123"),
    succeed("longlonglongstring", "123"),
  );
  assertEquals(literal_123("123456"), succeed("123", "456"));

  // Failing cases
  assertEquals(literal_beto("beta"), fail("beta"));
  assertEquals(literal_a("A"), fail("A"));
  assertEquals(
    literal_longlonglongstring("longextralonglongstring"),
    fail("longextralonglongstring", ""),
  );
  assertEquals(literal_123("124"), fail("124"));
});

Deno.test(function mapTest() {
  const charMap = map(char("a"), (char) => ({
    char,
  }));

  assertEquals(charMap("a"), succeed({ char: "a" }, ""));
});

Deno.test(function orTest() {
  const or_a_b = or(char("a"), char("b"));
  const or_zi_ll = or(and(char("z"), char("i")), and(char("l"), char("l")));

  // Passing cases
  assertEquals(or_a_b("a"), succeed("a", ""));
  assertEquals(or_a_b("b"), succeed("b", ""));
  assertEquals(or_zi_ll("zi"), succeed(["z", "i"], ""));
  assertEquals(or_zi_ll("ll"), succeed(["l", "l"], ""));
  // Failing cases
  assertEquals(or_a_b("c"), fail("c"));
  assertEquals(or_a_b("d"), fail("d"));
  assertEquals(or_zi_ll("iz"), fail("iz"));
  assertEquals(or_zi_ll("zz"), fail("zz"));
});

Deno.test(function andTest() {
  const and_a_b = and(char("a"), char("b"));
  const and_l_u = and(char("l"), char("u"));
  const and_zi_ll = and(and(char("z"), char("i")), and(char("l"), char("l")));

  // Passing cases
  assertEquals(and_a_b("ab"), succeed(["a", "b"], ""));
  assertEquals(and_l_u("luiz"), succeed(["l", "u"], "iz"));
  assertEquals(
    and_zi_ll("zillow"),
    succeed(
      [
        ["z", "i"],
        ["l", "l"],
      ],
      "ow",
    ),
  );
  // Failing cases
  assertEquals(and_a_b("ac"), fail("ac"));
  assertEquals(and_l_u("zu"), fail("zu"));
  assertEquals(and_zi_ll("zilkow"), fail("zilkow"));
});

Deno.test(function anyTest() {
  const any_a_b_c = any(char("a"), char("b"), char("c"));

  // Passing cases
  assertEquals(any_a_b_c("a"), succeed("a", ""));
  assertEquals(any_a_b_c("apple"), succeed("a", "pple"));
  assertEquals(any_a_b_c("b"), succeed("b", ""));
  assertEquals(any_a_b_c("big"), succeed("b", "ig"));
  assertEquals(any_a_b_c("c"), succeed("c", ""));
  assertEquals(any_a_b_c("casa"), succeed("c", "asa"));
  // Failing cases
  assertEquals(any_a_b_c("d"), fail("d"));
  assertEquals(any_a_b_c("dado"), fail("dado"));
  assertEquals(any_a_b_c("Abc"), fail("Abc"));
  assertEquals(any_a_b_c("Bac"), fail("Bac"));
  assertEquals(any_a_b_c("Cab"), fail("Cab"));
  assertEquals(any_a_b_c("ABC"), fail("ABC"));
});

Deno.test(function sequenceTest() {
  const sequence_l_u_i_z = sequence(char("l"), char("u"), char("i"), char("z"));
  const sequence_s_o_r_a_i_or_y_a = sequence(
    char("s"),
    char("o"),
    char("r"),
    char("a"),
    or(char("y"), char("i")),
    char("a"),
  );
  const sequence_b_e_t_o = sequence(char("b"), char("e"), char("t"), char("o"));

  // Passing cases
  assertEquals(sequence_l_u_i_z("luiz"), succeed(["l", "u", "i", "z"], ""));
  assertEquals(
    sequence_s_o_r_a_i_or_y_a("soraia"),
    succeed(["s", "o", "r", "a", "i", "a"], ""),
  );
  assertEquals(
    sequence_s_o_r_a_i_or_y_a("soraya"),
    succeed(["s", "o", "r", "a", "y", "a"], ""),
  );
  assertEquals(sequence_b_e_t_o("beto"), succeed(["b", "e", "t", "o"], ""));
  // Failing cases
  assertEquals(sequence_l_u_i_z("luis"), fail("luis"));
  assertEquals(sequence_l_u_i_z("ziul"), fail("ziul"));
  assertEquals(sequence_b_e_t_o("beta"), fail("beta"));
});

Deno.test(function exactlyTest() {
  // Passing cases
  assertEquals(
    exactly(3, literal("la"))("lalala"),
    succeed(["la", "la", "la"], ""),
  );
  assertEquals(
    exactly(2, char("z"))("zzzZZzzz"),
    succeed(["z", "z"], "zZZzzz"),
  );
  assertEquals(exactly(0, char("a"))("aaaaaa"), succeed([], "aaaaaa"));
  assertEquals(exactly(-1, char("a"))("aaaaaa"), succeed([], "aaaaaa"));
  // Failing cases
  assertEquals(exactly(3, literal("la"))("lalal"), fail("lalal"));
  assertEquals(exactly(1, literal("la"))("lululu"), fail("lululu"));
});

Deno.test(function someTest() {
  const some_lu = some(and(char("l"), char("u")));
  const some_a = some(char("a"));
  const some_optional_a = some(optional(char("a")));
  const some_empty = some(empty);

  // Passing cases
  assertEquals(
    some_lu("lulu"),
    succeed(
      [
        ["l", "u"],
        ["l", "u"],
      ],
      "",
    ),
  );
  assertEquals(
    some_lu("luluana"),
    succeed(
      [
        ["l", "u"],
        ["l", "u"],
      ],
      "ana",
    ),
  );
  assertEquals(some_a("aaa"), succeed(["a", "a", "a"], ""));
  assertEquals(some_a("aaaAaaa"), succeed(["a", "a", "a"], "Aaaa"));
  assertEquals(some_optional_a("aa"), succeed(["a", "a"], ""));
  assertEquals(some_empty(""), succeed<""[]>([""], ""));
  // Failing cases
  assertEquals(some_lu("lUlu"), fail("lUlu"));
  assertEquals(some_lu("Lulu"), fail("Lulu"));
  assertEquals(some_a("Aaa"), fail("Aaa"));
  assertEquals(some_a(""), fail(""));
});

Deno.test(function optionalTest() {
  const optional_l = optional(char("l"));
  const optional_plus = optional(char("+"));
  const optional_many_lu = optional(some(literal("lu")));

  // Passing cases
  assertEquals(optional_l("k"), succeed("", "k"));
  assertEquals(optional_plus("1"), succeed("", "1"));
  assertEquals(optional_plus("+1"), succeed("+", "1"));
  assertEquals(optional_many_lu("lalala"), succeed<"">("", "lalala"));
  assertEquals(
    optional_many_lu("lululu"),
    succeed<"lu"[]>(["lu", "lu", "lu"], ""),
  );
  // Failing cases
  // Should never fail
});

Deno.test(function precededByTest() {
  // Passing cases
  assertEquals(precededBy(char(","), char("a"))(",a"), succeed("a", ""));
  assertEquals(
    precededBy(literal("use"), literal("State"))("useState"),
    succeed("State", ""),
  );
  assertEquals(
    precededBy(char("<"), literal("div"))("<div />"),
    succeed("div", " />"),
  );

  // Failing cases
  assertEquals(precededBy(char(","), char("a"))(".a"), fail(".a"));
  assertEquals(
    precededBy(literal("use"), literal("State"))("usarState"),
    fail("usarState"),
  );
  assertEquals(precededBy(char("<"), literal("div"))("div />"), fail("div />"));
});

Deno.test(function succeededByTest() {
  // Passing cases
  assertEquals(succeededBy(char(","), char("a"))("a,"), succeed("a", ""));
  assertEquals(
    succeededBy(literal("/>"), literal("<div "))("<div />"),
    succeed("<div ", ""),
  );
  assertEquals(
    succeededBy(
      literal("/>"),
      and(literal("<div"), optional(some(char(" ")))),
    )("<div    />"),
    succeed(["<div", [" ", " ", " ", " "]], ""),
  );
  // Failing cases
  assertEquals(succeededBy(char(","), char("a"))("a."), fail("a."));
  assertEquals(succeededBy(char("b"), char("a"))("ac"), fail("ac"));
  assertEquals(
    succeededBy(literal("/>"), literal("<div "))("<div >"),
    fail("<div >"),
  );
});

Deno.test(function enclosedByTest() {
  // Passing cases
  assertEquals(
    delimitedBy(char("("), char(")"), literal("luiz"))("(luiz)"),
    succeed("luiz", ""),
  );
  assertEquals(
    delimitedBy(
      char("<"),
      and(some(optional(char(" "))), literal("/>")),
      literal("div"),
    )("<div     />"),
    succeed("div", ""),
  );
  assertEquals(
    delimitedBy(empty, empty, literal("beto"))("beto  "),
    succeed("beto", "  "),
  );
  // Failing cases
  assertEquals(
    delimitedBy(char("("), char(")"), literal("luiz"))("(luiz]"),
    fail("(luiz]"),
  );
  assertEquals(
    delimitedBy(char("("), char(")"), literal("luiz"))("[luiz)"),
    fail("[luiz)"),
  );
  assertEquals(
    delimitedBy(char("("), char(")"), literal("luiz"))("(soraya)"),
    fail("(soraya)"),
  );
});

// TODO: more tests
Deno.test(function surroundedByTest() {
  // Passing cases
  assertEquals(
    surroundedBy(char('"'), literal("quote"))('"quote"'),
    succeed("quote", ""),
  );
  // Failing cases
  assertEquals(
    surroundedBy(char('"'), literal("quote"))(`"quote'`),
    fail(`"quote'`, ""),
  );
});

Deno.test(function joinedByTest() {
  // Passing cases
  assertEquals(
    joinedBy(char(","), literal("luiz"))("luiz,luiz"),
    succeed(["luiz", "luiz"], ""),
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz, luiz"),
    succeed(["luiz", "luiz"], ""),
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz  ,  luiz"),
    succeed(["luiz", "luiz"], ""),
  );
  // Failing cases
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz  /  luiz"),
    fail("luiz  /  luiz"),
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz,beto"),
    fail("luiz,beto"),
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("soraya, luiz"),
    fail("soraya, luiz"),
  );
});

Deno.test(function spacedTest() {
  // Passing cases
  assertEquals(spaced(char("c"))("c"), succeed("c", ""));
  assertEquals(spaced(char("c"))("        c"), succeed("c", ""));
  assertEquals(spaced(char("c"))("c        "), succeed("c", ""));
  assertEquals(spaced(char("c"))("    c    "), succeed("c", ""));
  assertEquals(spaced(char("c"))("cb  "), succeed("c", "b  "));
  // Failing cases
  assertEquals(spaced(char("c"))("b  c"), fail("b  c"));
  assertEquals(spaced(char("c"))("bc"), fail("bc"));
  assertEquals(spaced(char("c"))("....c"), fail("....c"));
});

Deno.test(function naturalTest() {
  // Passing cases
  assertEquals(natural("00000104"), succeed(104, ""));
  assertEquals(natural("1abc"), succeed(1, "abc"));
  assertEquals(natural("123"), succeed(123, ""));
  assertEquals(natural("1000004040003"), succeed(1000004040003, ""));
  assertEquals(natural("000"), succeed(0, ""));
  assertEquals(natural("0"), succeed(0, ""));
  assertEquals(natural("1.1"), succeed(1, ".1"));
  // Failing cases
  assertEquals(natural("abc"), fail("abc"));
  assertEquals(natural("a1"), fail("a1"));
  assertEquals(natural("-0"), fail("-0"));
  assertEquals(natural("-130"), fail("-130"));
});

Deno.test(function integerTest() {
  // Passing cases
  assertEquals(integer("00000104"), succeed(104, ""));
  assertEquals(integer("1abc"), succeed(1, "abc"));
  assertEquals(integer("1000004040003"), succeed(1000004040003, ""));
  assertEquals(integer("000"), succeed(0, ""));
  assertEquals(integer("-0"), succeed(-0, ""));
  assertEquals(integer("-123a"), succeed(-123, "a"));
  assertEquals(integer("1.0"), succeed(1, ".0"));
  // Failing cases
  assertEquals(integer("abc"), fail("abc"));
  assertEquals(integer("a1"), fail("a1"));
  assertEquals(integer("a-130"), fail("a-130"));
  assertEquals(integer("-a-130"), fail("-a-130"));
});

Deno.test(function numberTest() {
  // Passing cases
  assertEquals(number("00000104"), succeed(104, ""));
  assertEquals(number("-00000104.13"), succeed(-104.13, ""));
  assertEquals(number("1.0abc"), succeed(1, "abc"));
  assertEquals(number("123.42"), succeed(123.42, ""));
  assertEquals(number("-123.42"), succeed(-123.42, ""));
  assertEquals(number("1000004040003"), succeed(1000004040003, ""));
  assertEquals(number("0.0"), succeed(0, ""));
  assertEquals(number("0.0040"), succeed(0.004, ""));
  assertEquals(number("-120.03400023"), succeed(-120.03400023, ""));
  // Failing cases
  assertEquals(number("abc"), fail("abc"));
  assertEquals(number("a1"), fail("a1"));
  assertEquals(integer("-a-130"), fail("-a-130"));
});
