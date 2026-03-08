export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (t === 'dark' || (!t && p)) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              }
            } catch(e){}
          })();
        `,
      }}
    />
  );
}