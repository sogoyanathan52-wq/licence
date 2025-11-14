// Définition des licences d'achat

export enum Licence {

  L1 = 'L1', // Base

  L2 = 'L2', // Intermédiaire

  L3 = 'L3', // Avancée

}



// Pot type pour la gestion des commissions futures (L2 est basé sur les ventes L1, etc.)

export enum PotType {

    L2 = 'L2', // Pot pour distribuer la commission L2 (alimenté par les ventes L1)

    L3 = 'L3', // Pot pour distribuer la commission L3 (alimenté par les ventes L2)

    L4 = 'L4', // Pot pour le Grand Prix L4 (alimenté par les ventes L3)

}



// Statut d'éligibilité de la prochaine commission que l'élève est autorisé à réclamer

// Cet éligibilité est déclenchée par l'achat de la licence courante

export enum EligibleCommissionType {

    NONE = 'NONE',

    L2 = 'L2', // Éligible pour commission L2 (déclenché par achat L1)

    L3 = 'L3', // Éligible pour commission L3 (déclenché par achat L2)

    L4 = 'L4', // Éligible pour commission L4 (déclenché par achat L3)

}



// Les rôles utilisateurs

export enum Role {

    SUPER_ADMIN = 'SUPER_ADMIN',

    ADMIN_ECOLE = 'ADMIN_ECOLE',

    STUDENT = 'STUDENT',

}