package br.com.baluarte.core.shared.pdf;

import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportRuntimeHints;

@Configuration
@ImportRuntimeHints(OpenPdfResourceHints.Registrar.class)
public class OpenPdfResourceHints {

    static class Registrar implements RuntimeHintsRegistrar {
        @Override
        public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
            hints.resources().registerPattern("com/lowagie/text/");
            hints.resources().registerPattern("com/lowagie/text/pdf/");
            hints.resources().registerPattern("com/lowagie/text/pdf/fonts/");
            hints.resources().registerPattern("com/lowagie/text/l10n/");
        }
    }
}
