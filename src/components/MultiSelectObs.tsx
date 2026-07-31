'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface MultiSelectObsProps {
  options: readonly string[] | string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectObs({ options, selectedValues, onChange }: MultiSelectObsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Lida com o clique fora para fechar o portal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Se clicou no botão, ignora (o onClick do botão já lida com o toggle)
      if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
        return;
      }
      
      // Para o portal, verificamos se o clique foi fora do documento (fechar)
      // Como o dropdown está no body, um clique fora dele deve fechar o menu.
      const portalNode = document.getElementById('portal-dropdown-menu');
      if (portalNode && !portalNode.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Atualiza a posição se a janela for redimensionada
      window.addEventListener("resize", updatePosition);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'absolute',
        top: `${rect.bottom + window.scrollY + 4}px`, // 4px de margem
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width > 250 ? rect.width : 300}px`, // Garante uma largura mínima legível
        zIndex: 99999,
      });
    }
  };

  const toggleOpen = () => {
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  const toggleOption = (option: string) => {
    const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];
    const isSelected = safeSelectedValues.includes(option);
    
    if (isSelected) {
      onChange(safeSelectedValues.filter(v => v !== option));
    } else {
      onChange([...safeSelectedValues, option]);
    }
  };

  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

  const displayText = safeSelectedValues.length === 0 
    ? "Selecione..." 
    : safeSelectedValues.length === 1 
      ? `${safeSelectedValues[0].substring(0, 25)}...` 
      : `${safeSelectedValues.length} observações`;

  // Renderiza o menu através do Portal se estiver aberto
  const renderDropdown = () => {
    if (!isOpen) return null;
    
    return createPortal(
      <div 
        id="portal-dropdown-menu"
        style={dropdownStyle}
        className="bg-white border border-[var(--color-cinza-borda)] rounded-md shadow-2xl max-h-64 overflow-y-auto"
      >
        <ul className="py-1">
          {options.map((option, idx) => {
            const isSelected = safeSelectedValues.includes(option);
            return (
              <li 
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleOption(option);
                }}
                className="flex items-start px-3 py-2.5 hover:bg-[var(--color-azul-lightest)] cursor-pointer transition-colors border-b border-[var(--color-cinza-fundo)] last:border-0"
              >
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-4 h-4 text-[var(--color-azul-autoridade)] border-gray-300 rounded focus:ring-[var(--color-azul-autoridade)] pointer-events-none"
                  />
                </div>
                <div className="ml-3 text-sm text-[var(--color-cinza-escuro)] select-none leading-tight">
                  {option}
                </div>
              </li>
            );
          })}
        </ul>
      </div>,
      document.body // Injeta diretamente no fim do HTML
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white border border-[var(--color-cinza-borda)] rounded-md shadow-sm hover:bg-[var(--color-azul-lightest)] focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-autoridade)] transition-colors min-h-[30px]"
      >
        <span className="truncate text-[var(--color-azul-autoridade)]">{displayText}</span>
        <ChevronDown className="w-4 h-4 text-[var(--color-cinza-texto)] flex-shrink-0" />
      </button>

      {/* Monta o portal quando isOpen for true */}
      {renderDropdown()}
    </>
  );
}
