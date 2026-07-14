import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/10 dark:to-accent/10">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/images/chase-logo.png"
          alt="Chase"
          width={80}
          height={80}
          className="rounded-xl shadow-lg"
          priority
        />
        <span className="text-2xl font-bold tracking-wide text-foreground">CHASE</span>
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground mt-4">Loading...</p>
      </div>
    </div>
  );
}
