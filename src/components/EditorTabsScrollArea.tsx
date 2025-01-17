import React, { useRef, useEffect } from "react";

export function EditorTabsScrollArea({ children }: { children: React.ReactNode }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            if (scrollRef.current) {
                scrollRef.current.scrollLeft += event.deltaY; // Ajusta el desplazamiento horizontal
                event.preventDefault(); // Evita el desplazamiento vertical
            }
        };

        const scrollContainer = scrollRef.current;
        scrollContainer?.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            scrollContainer?.removeEventListener("wheel", handleWheel);
        };
    }, []);

    useEffect(() => {
        // Asegúrate de que el scroll esté siempre al final después de renderizar
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth; // Desplaza al final
        }
    }, [children]); // Solo se ejecuta cuando cambian los children

    useEffect(() => {
        // Agrega los estilos al head del documento solo en el cliente
        const styleElement = document.createElement("style");
        styleElement.appendChild(
            document.createTextNode(`
            .hide-scrollbar::-webkit-scrollbar {
                display: none; /* Oculta la barra de desplazamiento en Chrome y Safari */
            }
            .hide-scrollbar {
                -ms-overflow-style: none;  /* Oculta la barra de desplazamiento en Internet Explorer y Edge */
                scrollbar-width: none;  /* Oculta la barra de desplazamiento en Firefox */
            }
        `)
        );
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement); // Limpia el estilo al desmontar el componente
        };
    }, []); // Solo se ejecuta una vez al montar el componente

    return (
        <div ref={scrollRef} className="overflow-x-auto whitespace-nowrap hide-scrollbar">
            <div className="flex space-x-1">{children}</div>
        </div>
    );
}
