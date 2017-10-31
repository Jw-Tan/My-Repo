var hierarchy = angular.module("hierarchy");
hierarchy.constant('FLWTYPES', {
    EA: {
        name: 'Edible Avoidable', definition: "any substance—whether processed, " +
            "semi-processed, or raw—that is intended for human consumption. " +
            "It includes drink, and any substance that has been used in the manufacture, " +
            "preparation, or treatment of food. It also includes material that has spoiled" +
            " and is therefore no longer fit for human consumption. It does not include cosmetics, " +
            "tobacco, or substances used only as drugs. It does not include processing agents used " +
            "along the food supply chain, for example, water to clean or cook raw materials in factories or at home."
    }, // edible avoidable
    EU: { name: 'Edible Unavoidable', definition: "It is caused by technical, design, raw material quality or process constraint "+
        "(e.g. purged soy sauce from pipe after every production run) "
    }, // edible unavoidable
    IU: {
        name: 'Inedible Unavoidable', definition: "is generated as a by-product of the main materials (ingredients) being consumed in a process " +
            "(e.g. eggs shells from the eggs used to bake cakes). This category of FLW is never intended for human consumption."
    },  // inedible unavoidable
    NOVAL: { name: '', definition: '' } // initialisation, no value
});