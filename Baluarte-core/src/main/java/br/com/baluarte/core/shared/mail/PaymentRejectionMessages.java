package br.com.baluarte.core.shared.mail;

import java.util.Map;

public final class PaymentRejectionMessages {

    private static final Map<String, String> MESSAGES = Map.ofEntries(
        Map.entry("cc_rejected_bad_filled_card_number", "O número do cartão informado é inválido."),
        Map.entry("cc_rejected_bad_filled_date", "A data de validade do cartão é inválida."),
        Map.entry("cc_rejected_bad_filled_security_code", "O código de segurança do cartão é inválido."),
        Map.entry("cc_rejected_bad_filled_other", "Verifique os dados do cartão e tente novamente."),
        Map.entry("cc_rejected_blacklist", "O cartão utilizado não é permitido para esta compra."),
        Map.entry("cc_rejected_call_for_authorize", "Entre em contato com seu banco para autorizar o pagamento."),
        Map.entry("cc_rejected_card_disabled", "O cartão informado está desativado. Entre em contato com seu banco."),
        Map.entry("cc_rejected_card_error", "Não foi possível processar o cartão. Tente outro cartão."),
        Map.entry("cc_rejected_duplicated_payment", "Já existe um pagamento idêntico em processamento."),
        Map.entry("cc_rejected_high_risk", "O pagamento foi recusado por questões de segurança."),
        Map.entry("cc_rejected_insufficient_amount", "Saldo insuficiente no cartão."),
        Map.entry("cc_rejected_invalid_installments", "O parcelamento selecionado não está disponível para este cartão."),
        Map.entry("cc_rejected_max_attempts", "Muitas tentativas de pagamento. Tente novamente mais tarde."),
        Map.entry("cc_rejected_other_reason", "O cartão foi recusado pela operadora.")
    );

    private PaymentRejectionMessages() {}

    public static String translate(String statusDetail) {
        if (statusDetail == null || statusDetail.isBlank()) {
            return "Pagamento recusado pela operadora do cartão.";
        }
        return MESSAGES.getOrDefault(statusDetail.toLowerCase(),
            "Pagamento recusado (" + statusDetail + ").");
    }
}
