import { assertEquals } from "https://deno.land/std@0.202.0/assert/assert_equals.ts";
import {
  char,
  literal,
  empty,
  fail,
  map,
  ok,
  satisfy,
  or,
  and,
  any,
  all,
  exactly,
  many,
  optional,
  precededBy,
  succeededBy,
  surroundedBy,
  joinedBy,
  spaced,
  natural,
  integer,
  number,
} from "./main.ts";
import { enclosedBy } from "./main.ts";

Deno.test(function satisfyTest() {
  const satisfy_L_u_i_z = satisfy((c) => ["L", "u", "i", "z"].includes(c));

  // Passing cases
  assertEquals(satisfy_L_u_i_z("L"), ok("L", ""));
  assertEquals(satisfy_L_u_i_z("u"), ok("u", ""));
  assertEquals(satisfy_L_u_i_z("i"), ok("i", ""));
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
  assertEquals(char_a("abc"), ok("a", "bc"));
  assertEquals(char_l("luiz"), ok("l", "uiz"));
  assertEquals(char_Z("Zillow"), ok("Z", "illow"));
  // Failing cases
  assertEquals(char_l("Luiz"), fail("Luiz"));
  assertEquals(char_Z("z"), fail("z"));
  assertEquals(char_a("A"), fail("A"));
});

Deno.test(function emptyTest() {
  // Passing cases
  assertEquals(empty("abc"), ok("", "abc"));
  assertEquals(empty("luiz"), ok("", "luiz"));
  assertEquals(empty("Zillow"), ok("", "Zillow"));
  // Failing cases
  // Should never fail
});

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
    ok("longlonglongstring", "123")
  );
  assertEquals(literal_123("123456"), ok("123", "456"));

  // Failing cases
  assertEquals(literal_beto("beta"), fail("beta"));
  assertEquals(literal_a("A"), fail("A"));
  assertEquals(
    literal_longlonglongstring("longextralonglongstring"),
    fail("longextralonglongstring", "")
  );
  assertEquals(literal_123("124"), fail("124"));
});

Deno.test(function mapTest() {
  const charMap = map(char("a"), (char) => ({
    char,
  }));

  assertEquals(charMap("a"), ok({ char: "a" }, ""));
});

Deno.test(function orTest() {
  const or_a_b = or(char("a"), char("b"));
  const or_zi_ll = or(and(char("z"), char("i")), and(char("l"), char("l")));

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

Deno.test(function andTest() {
  const and_a_b = and(char("a"), char("b"));
  const and_l_u = and(char("l"), char("u"));
  const and_zi_ll = and(and(char("z"), char("i")), and(char("l"), char("l")));

  // Passing cases
  assertEquals(and_a_b("ab"), ok(["a", "b"], ""));
  assertEquals(and_l_u("luiz"), ok(["l", "u"], "iz"));
  assertEquals(
    and_zi_ll("zillow"),
    ok(
      [
        ["z", "i"],
        ["l", "l"],
      ],
      "ow"
    )
  );
  // Failing cases
  assertEquals(and_a_b("ac"), fail("ac"));
  assertEquals(and_l_u("zu"), fail("zu"));
  assertEquals(and_zi_ll("zilkow"), fail("zilkow"));
});

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

Deno.test(function allTest() {
  const all_l_u_i_z = all(char("l"), char("u"), char("i"), char("z"));
  const all_s_o_r_a_i_or_y_a = all(
    char("s"),
    char("o"),
    char("r"),
    char("a"),
    or(char("y"), char("i")),
    char("a")
  );
  const all_b_e_t_o = all(char("b"), char("e"), char("t"), char("o"));

  // Passing cases
  assertEquals(all_l_u_i_z("luiz"), ok(["l", "u", "i", "z"], ""));
  assertEquals(
    all_s_o_r_a_i_or_y_a("soraia"),
    ok(["s", "o", "r", "a", "i", "a"], "")
  );
  assertEquals(
    all_s_o_r_a_i_or_y_a("soraya"),
    ok(["s", "o", "r", "a", "y", "a"], "")
  );
  assertEquals(all_b_e_t_o("beto"), ok(["b", "e", "t", "o"], ""));
  // Failing cases
  assertEquals(all_l_u_i_z("luis"), fail("luis"));
  assertEquals(all_l_u_i_z("ziul"), fail("ziul"));
  assertEquals(all_b_e_t_o("beta"), fail("beta"));
});

Deno.test(function exactlyTest() {
  // Passing cases
  assertEquals(exactly(3, literal("la"))("lalala"), ok(["la", "la", "la"], ""));
  assertEquals(exactly(2, char("z"))("zzzZZzzz"), ok(["z", "z"], "zZZzzz"));
  assertEquals(exactly(0, char("a"))("aaaaaa"), ok([], "aaaaaa"));
  assertEquals(exactly(-1, char("a"))("aaaaaa"), ok([], "aaaaaa"));
  // Failing cases
  assertEquals(exactly(3, literal("la"))("lalal"), fail("lalal"));
  assertEquals(exactly(1, literal("la"))("lululu"), fail("lululu"));
});

Deno.test(function manyTest() {
  const many_lu = many(and(char("l"), char("u")));
  const many_a = many(char("a"));
  const many_optional_a = many(optional(char("a")));
  const many_empty = many(empty);

  // Passing cases
  assertEquals(
    many_lu("lulu"),
    ok(
      [
        ["l", "u"],
        ["l", "u"],
      ],
      ""
    )
  );
  assertEquals(
    many_lu("luluana"),
    ok(
      [
        ["l", "u"],
        ["l", "u"],
      ],
      "ana"
    )
  );
  assertEquals(many_a("aaa"), ok(["a", "a", "a"], ""));
  assertEquals(many_a("aaaAaaa"), ok(["a", "a", "a"], "Aaaa"));
  assertEquals(many_optional_a("aa"), ok(["a", "a"], ""));
  assertEquals(many_empty(""), ok<""[]>([""], ""));
  // Failing cases
  assertEquals(many_lu("lUlu"), fail("lUlu"));
  assertEquals(many_lu("Lulu"), fail("Lulu"));
  assertEquals(many_a("Aaa"), fail("Aaa"));
  assertEquals(many_a(""), fail(""));
});

Deno.test(function optionalTest() {
  const optional_l = optional(char("l"));
  const optional_plus = optional(char("+"));
  const optional_many_lu = optional(many(literal("lu")));

  // Passing cases
  assertEquals(optional_l("k"), ok("", "k"));
  assertEquals(optional_plus("1"), ok("", "1"));
  assertEquals(optional_plus("+1"), ok("+", "1"));
  assertEquals(optional_many_lu("lalala"), ok<"">("", "lalala"));
  assertEquals(optional_many_lu("lululu"), ok<"lu"[]>(["lu", "lu", "lu"], ""));
  // Failing cases
  // Should never fail
});

Deno.test(function precededByTest() {
  // Passing cases
  assertEquals(precededBy(char(","), char("a"))(",a"), ok("a", ""));
  assertEquals(
    precededBy(literal("use"), literal("State"))("useState"),
    ok("State", "")
  );
  assertEquals(
    precededBy(char("<"), literal("div"))("<div />"),
    ok("div", " />")
  );

  // Failing cases
  assertEquals(precededBy(char(","), char("a"))(".a"), fail(".a"));
  assertEquals(
    precededBy(literal("use"), literal("State"))("usarState"),
    fail("usarState")
  );
  assertEquals(precededBy(char("<"), literal("div"))("div />"), fail("div />"));
});

Deno.test(function succeededByTest() {
  // Passing cases
  assertEquals(succeededBy(char(","), char("a"))("a,"), ok("a", ""));
  assertEquals(
    succeededBy(literal("/>"), literal("<div "))("<div />"),
    ok("<div ", "")
  );
  assertEquals(
    succeededBy(
      literal("/>"),
      and(literal("<div"), optional(many(char(" "))))
    )("<div    />"),
    ok(["<div", [" ", " ", " ", " "]], "")
  );
  // Failing cases
  assertEquals(succeededBy(char(","), char("a"))("a."), fail("a."));
  assertEquals(succeededBy(char("b"), char("a"))("ac"), fail("ac"));
  assertEquals(
    succeededBy(literal("/>"), literal("<div "))("<div >"),
    fail("<div >")
  );
});

Deno.test(function enclosedByTest() {
  // Passing cases
  assertEquals(
    enclosedBy(char("("), char(")"), literal("luiz"))("(luiz)"),
    ok("luiz", "")
  );
  assertEquals(
    enclosedBy(
      char("<"),
      and(many(optional(char(" "))), literal("/>")),
      literal("div")
    )("<div     />"),
    ok("div", "")
  );
  assertEquals(
    enclosedBy(empty, empty, literal("beto"))("beto  "),
    ok("beto", "  ")
  );
  // Failing cases
  assertEquals(
    enclosedBy(char("("), char(")"), literal("luiz"))("(luiz]"),
    fail("(luiz]")
  );
  assertEquals(
    enclosedBy(char("("), char(")"), literal("luiz"))("[luiz)"),
    fail("[luiz)")
  );
  assertEquals(
    enclosedBy(char("("), char(")"), literal("luiz"))("(soraya)"),
    fail("(soraya)")
  );
});

// TODO: more tests
Deno.test(function surroundedByTest() {
  // Passing cases
  assertEquals(
    surroundedBy(char('"'), literal("quote"))('"quote"'),
    ok("quote", "")
  );
  // Failing cases
  assertEquals(
    surroundedBy(char('"'), literal("quote"))(`"quote'`),
    fail(`"quote'`, "")
  );
});

Deno.test(function joinedByTest() {
  // Passing cases
  assertEquals(
    joinedBy(char(","), literal("luiz"))("luiz,luiz"),
    ok(["luiz", "luiz"], "")
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz, luiz"),
    ok(["luiz", "luiz"], "")
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz  ,  luiz"),
    ok(["luiz", "luiz"], "")
  );
  // Failing cases
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz  /  luiz"),
    fail("luiz  /  luiz")
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("luiz,beto"),
    fail("luiz,beto")
  );
  assertEquals(
    joinedBy(char(","), spaced(literal("luiz")))("soraya, luiz"),
    fail("soraya, luiz")
  );
});

Deno.test(function spacedTest() {
  // Passing cases
  assertEquals(spaced(char("c"))("c"), ok("c", ""));
  assertEquals(spaced(char("c"))("        c"), ok("c", ""));
  assertEquals(spaced(char("c"))("c        "), ok("c", ""));
  assertEquals(spaced(char("c"))("    c    "), ok("c", ""));
  assertEquals(spaced(char("c"))("cb  "), ok("c", "b  "));
  // Failing cases
  assertEquals(spaced(char("c"))("b  c"), fail("b  c"));
  assertEquals(spaced(char("c"))("bc"), fail("bc"));
  assertEquals(spaced(char("c"))("....c"), fail("....c"));
});

Deno.test(function naturalTest() {
  // Passing cases
  assertEquals(natural("00000104"), ok(104, ""));
  assertEquals(natural("1abc"), ok(1, "abc"));
  assertEquals(natural("123"), ok(123, ""));
  assertEquals(natural("1000004040003"), ok(1000004040003, ""));
  assertEquals(natural("000"), ok(0, ""));
  assertEquals(natural("0"), ok(0, ""));
  assertEquals(natural("1.1"), ok(1, ".1"));
  // Failing cases
  assertEquals(natural("abc"), fail("abc"));
  assertEquals(natural("a1"), fail("a1"));
  assertEquals(natural("-0"), fail("-0"));
  assertEquals(natural("-130"), fail("-130"));
});

Deno.test(function integerTest() {
  // Passing cases
  assertEquals(integer("00000104"), ok(104, ""));
  assertEquals(integer("1abc"), ok(1, "abc"));
  assertEquals(integer("1000004040003"), ok(1000004040003, ""));
  assertEquals(integer("000"), ok(0, ""));
  assertEquals(integer("-0"), ok(-0, ""));
  assertEquals(integer("-123a"), ok(-123, "a"));
  assertEquals(integer("1.0"), ok(1, ".0"));
  // Failing cases
  assertEquals(integer("abc"), fail("abc"));
  assertEquals(integer("a1"), fail("a1"));
  assertEquals(integer("a-130"), fail("a-130"));
  assertEquals(integer("-a-130"), fail("-a-130"));
});

Deno.test(function numberTest() {
  // Passing cases
  assertEquals(number("00000104"), ok(104, ""));
  assertEquals(number("-00000104.13"), ok(-104.13, ""));
  assertEquals(number("1.0abc"), ok(1, "abc"));
  assertEquals(number("123.42"), ok(123.42, ""));
  assertEquals(number("-123.42"), ok(-123.42, ""));
  assertEquals(number("1000004040003"), ok(1000004040003, ""));
  assertEquals(number("0.0"), ok(0, ""));
  assertEquals(number("0.0040"), ok(0.004, ""));
  assertEquals(number("-120.03400023"), ok(-120.03400023, ""));
  // Failing cases
  assertEquals(number("abc"), fail("abc"));
  assertEquals(number("a1"), fail("a1"));
  assertEquals(integer("-a-130"), fail("-a-130"));
});
