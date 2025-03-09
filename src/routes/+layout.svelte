<script lang="ts">
	import '../app.css';
    import { Toaster } from "@/sonner";
	let { children } = $props();
</script>
<Toaster />
{@render children()}
