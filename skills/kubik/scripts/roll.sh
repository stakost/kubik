#!/usr/bin/env bash
# roll: a real throw of the dice, so a design does not start from the most likely answer.
#
#   bash roll.sh colour="ember|tide|moss" type="A + B|C + D" hero="poster|split|cascade"
#
# Prints one card per group, drawn with the system's random source (/dev/urandom).
# A group may ask for several cards:        effects:2="grain|glass|halftone|bloom"
# A card may be weighted to lean the dice:  ground="night sky*3|warm paper|white"
#
# Needs only bash (3.2 or newer) and od. Exit code: 0, or 2 on a usage error.

if [ "$#" -eq 0 ]; then
  echo 'usage: bash roll.sh group="a|b|c" [group:2="a|b|c|d"] [group="a*3|b"] ...' >&2
  exit 2
fi

random_below() {  # random_below <n> -> a number from 0 to n-1
  local r
  r="$(od -An -N4 -tu4 /dev/urandom 2>/dev/null | tr -d ' \n')"
  [ -n "$r" ] || r=$(( (RANDOM << 15) | RANDOM ))
  echo $(( r % $1 ))
}

trim() {  # strips leading and trailing blanks
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

for arg in "$@"; do
  case "$arg" in
    ?*=*) ;;
    *) echo "roll: cannot read \"$arg\" (expected group=\"a|b|c\")" >&2; exit 2 ;;
  esac
  head="${arg%%=*}"
  rest="${arg#*=}"
  name="${head%%:*}"
  count=1
  case "$head" in *:*) count="${head#*:}" ;; esac
  case "$count" in ''|*[!0-9]*) count=1 ;; esac
  [ "$count" -ge 1 ] || count=1

  cards=()
  weights=()
  old_ifs="$IFS"; IFS='|'
  # shellcheck disable=SC2206
  set -f; parts=($rest); set +f
  IFS="$old_ifs"
  for part in "${parts[@]}"; do
    card="$(trim "$part")"
    [ -n "$card" ] || continue
    weight=1
    case "$card" in
      *'*'*)
        tail="$(trim "${card##*'*'}")"
        case "$tail" in
          ''|*[!0-9]*) ;;
          *) weight="$tail"; card="$(trim "${card%'*'*}")" ;;
        esac ;;
    esac
    [ "$weight" -ge 1 ] || weight=1
    [ -n "$card" ] || continue
    cards+=("$card")
    weights+=("$weight")
  done

  if [ "${#cards[@]}" -eq 0 ]; then
    echo "roll: the group \"$name\" has no cards left" >&2
    exit 2
  fi
  [ "$count" -le "${#cards[@]}" ] || count="${#cards[@]}"

  picked=""
  drawn=0
  while [ "$drawn" -lt "$count" ]; do
    total=0
    for w in "${weights[@]}"; do total=$(( total + w )); done
    at="$(random_below "$total")"
    i=0
    while [ "$i" -lt "${#cards[@]}" ]; do
      at=$(( at - weights[i] ))
      [ "$at" -lt 0 ] && break
      i=$(( i + 1 ))
    done
    if [ -z "$picked" ]; then picked="${cards[$i]}"; else picked="$picked + ${cards[$i]}"; fi
    # draw without replacement: drop the card that came out
    next_cards=(); next_weights=(); j=0
    while [ "$j" -lt "${#cards[@]}" ]; do
      if [ "$j" -ne "$i" ]; then next_cards+=("${cards[$j]}"); next_weights+=("${weights[$j]}"); fi
      j=$(( j + 1 ))
    done
    cards=("${next_cards[@]}"); weights=("${next_weights[@]}")
    drawn=$(( drawn + 1 ))
  done
  printf '%s: %s\n' "$name" "$picked"
done
