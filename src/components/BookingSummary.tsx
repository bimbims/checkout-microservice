import React from 'react';
import { Calendar, Users, Home } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '../types';

interface BookingSummaryProps {
  booking: Booking;
  stayAmount: number;
  depositAmount: number;
  totalAmount: number;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  booking,
  stayAmount,
  depositAmount,
  totalAmount,
}) => {
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const totalGuests =
    booking.guest_counts.adults +
    booking.guest_counts.children +
    booking.guest_counts.infants;

  return (
    <div className="bg-white border border-ibira-border p-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="font-serif text-2xl text-ibira-green mb-2">
          Resumo da Reserva
        </h2>
        <p className="text-sm text-ibira-green/60 uppercase tracking-wider">
          {booking.id}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Home size={18} className="text-ibira-green/60" />
          <div>
            <p className="text-sm text-ibira-green/60">Propriedade</p>
            <p className="font-medium text-ibira-green">{booking.house_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-ibira-green/60" />
          <div>
            <p className="text-sm text-ibira-green/60">Período</p>
            <p className="font-medium text-ibira-green">
              {format(parseISO(booking.check_in), 'dd MMM yyyy', { locale: ptBR })} -{' '}
              {format(parseISO(booking.check_out), 'dd MMM yyyy', { locale: ptBR })}
            </p>
            <p className="text-xs text-ibira-green/50">
              {nights} {nights === 1 ? 'noite' : 'noites'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Users size={18} className="text-ibira-green/60" />
          <div>
            <p className="text-sm text-ibira-green/60">Hóspedes</p>
            <p className="font-medium text-ibira-green">
              {totalGuests} {totalGuests === 1 ? 'pessoa' : 'pessoas'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-ibira-border-light pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-ibira-green/70">Valor da Estadia</span>
          <span className="font-medium text-ibira-green">
            {stayAmount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-ibira-green/70">Caução (pré-autorização)</span>
          <span className="font-medium text-ibira-green">
            {depositAmount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>

        <div className="flex justify-between text-base font-semibold pt-2 border-t border-ibira-border-light">
          <span className="text-ibira-green">Total</span>
          <span className="text-ibira-green">
            {totalAmount.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
        </div>
      </div>

      <div className="bg-ibira-beige/50 border border-ibira-border p-4 text-xs text-ibira-green/70 space-y-1">
        <p>
          <strong>Importante:</strong> O valor do caução será apenas pré-autorizado em
          seu cartão, sem cobrança imediata.
        </p>
        <p>
          O valor será automaticamente liberado após o checkout, caso não haja danos à
          propriedade.
        </p>
      </div>
    </div>
  );
};

export default BookingSummary;
