<script lang="ts">
  import { flip } from "svelte/animate";

  let {
    id = undefined,
    tags = $bindable([] as string[]),
    tagLimit = 0,
    name = "tags",
    placeholder = "Insert tags here",
    delimiter = ",",
    allowRepeats = false,
    disabled = false,
  } = $props();
  let input = $state("");
  let inputElement: HTMLInputElement;
  const hasTagLimitBeenReached = $derived(
    tagLimit > 0 && tags.length >= tagLimit,
  );

  function addTag(tag: string) {
    tag = tag.trim();
    if (!tag) return;
    if (tagLimit && tags.length >= tagLimit) return;
    if (
      !allowRepeats &&
      tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
    )
      return;

    tags = [...tags, tag];
    input = "";
    inputElement.focus();
  }

  function removeTag(i: number) {
    tags = tags.filter((_, idx) => idx !== i);
    inputElement.focus();
  }

  function splitTags(value: string) {
    return value.split(delimiter);
  }

  function commitPending() {
    if (input) addTag(input);
  }

  function keydown(event: KeyboardEvent) {
    if (event.code === "Backspace" || event.code === "Delete") {
      if (input === "") removeTag(tags.length - 1);
    }

    if (event.code === "Enter") {
      event.preventDefault();
      commitPending();
    }
  }
</script>

<div class="form-tags__wrapper">
  {#each tags as tag, i (tag)}
    <span animate:flip={{ duration: 100 }}>
      {tag}

      <button
        class="form-tags__remove_tag"
        onclick={(e) => {
          e.preventDefault();
          removeTag(i);
        }}
        {disabled}
      >
        &#215;
      </button>
    </span>
  {/each}

  <input
    type="text"
    {id}
    bind:this={inputElement}
    bind:value={input}
    oninput={() => {
      if (!input.includes(delimiter)) return;

      splitTags(input).forEach((tag) => addTag(tag));
    }}
    onkeydown={keydown}
    onblur={commitPending}
    {disabled}
    placeholder={hasTagLimitBeenReached ? "" : placeholder}
    readonly={hasTagLimitBeenReached}
  />

  <input {name} value={tags.join(delimiter)} type="hidden" />
</div>
