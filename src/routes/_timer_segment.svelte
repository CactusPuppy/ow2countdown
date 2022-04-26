<script lang="ts">
  export let value : number;
  export let unit : string;
</script>

<div class="flex flex-col">
  <p class="text-2xl">{ value }</p>
  <p class="text-sm">{ unit }</p>
</div>
