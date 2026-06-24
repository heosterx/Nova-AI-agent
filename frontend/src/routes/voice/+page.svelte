<script lang="ts">
  import { Mic, MicOff, Volume2 } from 'lucide-svelte';
  import VoiceWaveform from '$lib/components/VoiceWaveform.svelte';

  let voiceState: 'idle' | 'recording' | 'playing' | 'error' = $state('idle');
  let transcript: Array<{ role: string; content: string }> = $state([]);

  function toggleRecording() {
    if (voiceState === 'recording') {
      voiceState = 'idle';
    } else {
      voiceState = 'recording';
    }
  }
</script>

<svelte:head>
  <title>Voice - Nova</title>
</svelte:head>

<div class="max-w-2xl mx-auto text-center">
  <div class="flex items-center justify-center gap-3 mb-8">
    <Volume2 size={24} class="text-accent-cyan" />
    <h1 class="font-mono font-bold text-xl">Voice Mode</h1>
  </div>

  <div class="bg-bg-secondary border border-border rounded-2xl p-8 mb-6">
    <VoiceWaveform state={voiceState} />

    <div class="mt-6">
      <button
        onclick={toggleRecording}
        class="w-16 h-16 rounded-full flex items-center justify-center transition-all mx-auto
          {voiceState === 'recording'
            ? 'bg-accent-red text-white ring-4 ring-accent-red/30 animate-pulse'
            : 'bg-accent-cyan text-white hover:ring-4 hover:ring-accent-cyan/30'}"
      >
        {#if voiceState === 'recording'}
          <MicOff size={24} />
        {:else}
          <Mic size={24} />
        {/if}
      </button>
      <p class="text-xs text-text-secondary mt-3">
        {voiceState === 'recording' ? 'Recording... Click to stop' : 'Click to start recording'}
      </p>
    </div>
  </div>

  {#if transcript.length > 0}
    <div class="space-y-3 text-left">
      {#each transcript as entry}
        <div class="flex gap-3 {entry.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] rounded-xl px-4 py-2 text-sm
            {entry.role === 'user' ? 'bg-accent-primary text-white' : 'bg-bg-secondary border border-border'}">
            {entry.content}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="text-text-secondary text-sm">
      Press the microphone button or hold spacebar to start a voice conversation with Nova.
    </p>
  {/if}
</div>
