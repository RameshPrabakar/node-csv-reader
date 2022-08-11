import * as fs from "fs";
import * as path from "path";
import { parse } from 'csv-parse';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import _ from 'lodash';

type ItemList = {
    id: string;
    destination: string;
    product: string;
    quantity: number;
    brand: string;
};

let findPopularBrand = (arr: any) => {
    return arr.sort((a: any, b: any) =>
        arr.filter((v: { brand: any; }) => v.brand === a.brand).length
        - arr.filter((v: { brand: any; }) => v.brand === b.brand).length
    ).pop();
};

(() => {
    const csvFilePath = path.resolve(__dirname, 'files/input_file.csv');    
    const headers = ['id', 'destination', 'product', 'quantity', 'brand'];

    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    let output_records: any[] = [];

    parse(fileContent, {
        delimiter: ',',
        columns: headers,
        fromLine: 2,
        on_record: (line, context) => {
            return line;
        },
    }, async (error, records: ItemList[]) => {
        if (error) {
            console.error(error);
        }

        let recordCount = records.length;

        // Groupby the product to solve problem
        const productsGroup = _.chain(records).groupBy(record => record['product']).value();
        const productNames = _.uniq(_.map(records, 'product'));
        let productArr = [];

        for (var i = 0; i < productNames.length; i++) {
            let productObj = {
                product: '',
                maxBrand: '',
                avgOrder: 0
            }
            productArr = productsGroup[productNames[i]];

            const quantitySum: number = productArr.reduce((n, { quantity }) => n + Number(quantity), 0);

            let popularBrand = findPopularBrand(productArr);

            productObj.product = productNames[i];
            let avg: any = quantitySum / recordCount;
            const average = Number(parseFloat(avg).toFixed(2));

            productObj.avgOrder = average;
            productObj.maxBrand = popularBrand?.brand;
            output_records.push(productObj);
        }


        const csvWriter1 = createCsvWriter({
            path: path.resolve(__dirname, 'files/0_input_file.csv'),
            header: [
                { id: 'product', title: "Product" },
                { id: 'avgOrder', title: "Avg order" },
            ],

        });

        const csvWriter2 = createCsvWriter({
            path: path.resolve(__dirname, 'files/1_input_file.csv'),
            header: [
                { id: 'product', title: 'Product' },
                { id: 'maxBrand', title: "Popular Brand" },
            ],

        });

        await csvWriter1.writeRecords(output_records);
        await csvWriter2.writeRecords(output_records);

    });

})();