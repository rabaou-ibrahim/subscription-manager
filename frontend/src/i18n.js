// src/i18n.js
export const translations = {
  fr: {
    search: "Rechercher",
    noSubscriptions: "Aucun abonnement trouvé.",
    details: "Détails",
    amount: "Montant",
    startDate: "Date de début",
    endDate: "Date de fin",
    renewal: "Renouvellement",
    billingMode: "Mode de paiement",
    service: "Service associé",
    member: "Utilisateur",
    edit: "Éditer",
    delete: "Supprimer",
    addSubscription: "Nouvel abonnement",
    editSubscription: "Éditer l’abonnement",
    save: "Enregistrer",
  },
  en: {
    search: "Search",
    noSubscriptions: "No subscriptions found.",
    details: "Details",
    amount: "Amount",
    startDate: "Start date",
    endDate: "End date",
    renewal: "Renewal",
    billingMode: "Billing mode",
    service: "Service",
    member: "Member",
    edit: "Edit",
    delete: "Delete",
    addSubscription: "Add subscription",
    editSubscription: "Edit subscription",
    save: "Save",
  },
};

export const lang = "fr";

export const t = (key) => translations[lang][key] || key;
