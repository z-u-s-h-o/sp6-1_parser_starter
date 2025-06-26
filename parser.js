/**
 * Функция для парсинга данных со страницы
 * @returns object
 */

function parsePage() {
    /**
     * Функция для определения валюты по символу
     * @param symbolCurrency символ
     * @returns string наименование валюты
     */
    function getCurrency(symbolCurrency) {
        switch (symbolCurrency) {
            case "$":
                return "USD";
            case "€":
                return "EUR";
            case "₽":
                return "RUB";
            default:
                return "Unknown Currency";
        }
    }

    /**
     * Функция для форматирования даты в формат DD_MM_YYYY
     * @param date дата
     * @returns string дата в новом формате
     */
    function reformatDateDD_MM_YYYY(date){
        const [day, month, year] = date.split('/');
        return `${day}.${month}.${year}`;
    }

    /**
     * Функция для расчета процента скидки
     * @param price цена за вычетом скидки
     * @param oldPrice первоначальная цена
     * @returns string
     */
    function getDiscountPercent(price, oldPrice) {
        const discount = (1 - price / oldPrice) * 100;
        return `${discount.toFixed(2)}%`;
    }

    /**
     * Функция для парсинга мета данных страницы
     * @returns object
     */
    function parseMeta() {

        /**
         * Функция для получения заголовка страницы без названия сайта
         * @returns string первая часть разделенной строки по символу "—"
         */
        function getTitle (titleAll) {
            return titleAll.split('—')[0].trim();
        }

        /**
         * Функция для получения og:* тэгов
         * @returns object
         */
        function getOpengraph(){
            const ogTitle = document.querySelector('meta[property="og:title"]')
            .getAttribute('content');
            const ogImage = document.querySelector('meta[property="og:image"]')
            .getAttribute('content');
            const ogtype = document.querySelector('meta[property="og:type"]')
            .getAttribute('content');

            return {
                "title": getTitle(ogTitle),
                "image": ogImage,
                "type": ogtype,
            }
        }

        //получаем язык страницы с тега html
        const language = document.querySelector('html')
        .getAttribute('lang');

        //получаем заголовок страницы
        const title = document.querySelector('title').textContent;

        //получаем ключевые слова из мета-тега
        const keywords = document.querySelector('meta[name="keywords"]')
        .getAttribute('content')
        .split(',')
        .map(item => item.trim());

        //получаем описание из мета-тега.
        const description = document.querySelector('meta[name="description"]')
        .getAttribute('content')
        .trim();

        return {
            "title": getTitle(title),
            "description": description,
            "keywords": keywords,
            "language": language,
            "opengraph": getOpengraph(),
        }
    }

    /**
     * Функция для парсинга данных о продуктах
     * @returns object
     */
    function parseProduct(){

        //получаем ссылку на секцию с продуктами, для уточнения поиска вложенных селекторов
        const productSection = document.querySelector('.product');

        /**
         * Функция для получения массива изображений продукта
         * @returns object
         */
        function getImages(){
            const descriptionsImage = Array.from(productSection.querySelectorAll('.preview nav button img'))
            .map(image => {
                return {
                    "preview": image.getAttribute('src'),
                    "full": image.dataset.src,
                    "alt": image.getAttribute('alt'),
                };
            });
            return descriptionsImage;
        }

        /**
         * Функция для получения массива тегов, категорий и скидок
         * @returns object
         */
        function getTags() {
            const tagContainer = productSection.querySelector('.about .tags');

            const tagCategories = Array.from(tagContainer.querySelectorAll('.green'))
            .map(tag => {
                return tag.textContent.trim();
            });

            const tagDiscounts = Array.from(tagContainer.querySelectorAll('.red'))
            .map(tag => {
                return tag.textContent.trim();
            });

            const tagLabels = Array.from(tagContainer.querySelectorAll('.blue'))
            .map(tag => {
                return tag.textContent.trim();
            });

            return {
                category: tagCategories,
                discount: tagDiscounts,
                label: tagLabels,
            };
        }

        /**
         * Функция для проверки наличия класса active у кнопки like
         * @returns boolean
         */
        function isLiked() {
            const likeButton = productSection.querySelector('.like');
            if (likeButton.classList.contains('active')) {
                return true;
            }
            return false;
        }

        /**
         * Функция для получения свойств товара
         * @returns object
         */
        function getProperties() {
            const properties = Array.from(productSection.querySelectorAll('.properties li'))
            .reduce((propertyKeys, property) => {
                const keys = Array.from(property.querySelectorAll('span'))
                .map(key => {
                    return key.textContent.trim()
                });
                propertyKeys[keys[0]] = keys[1];
                return propertyKeys;
            },{})

            return properties;
        }

        /**
         * Функция для получения описания товара
         * @returns object
         */
        function getDescription() {
            //получаем блок с описанием
            const descriptionBlock = productSection.querySelector('.description');
            //создаем копию блока, чтобы избежать изменения в структуре при удалении атрибутов
            const descriptionBlockClone = document.createElement('div');
            descriptionBlockClone.innerHTML = descriptionBlock.innerHTML;

            /**
             * Функция для удаления атрибутов у блока html разметки
             * рекурсивно удаляет у всех дочерних элементов
             * @param element родительский элемент разметки
             * @returns string innerHTML без атрибутов
             */
            function removeAttributes(element) {
                for (let attr of element.attributes) {
                    element.removeAttribute(attr.name);
                }
                element.childNodes.forEach(child => {
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        removeAttributes(child);
                    }
                });
            }

            //удаляем у клонированного объекта атрибуты 
            removeAttributes(descriptionBlockClone);

            return descriptionBlockClone.innerHTML.trim();
        }

        //получаем id товара из data атрибутов
        const id = document.querySelector('.product').dataset.id;

        //получаем наименование товара
        const name = document.querySelector('h1').textContent.trim();

        //получаем цену и цену после скидки через деструктуризация текстовой строки
        const priceContainer = document.querySelector('.price');
        const contentPriceContainer = priceContainer.textContent.trim();
        const [price, oldPrice] = contentPriceContainer.match(/\d+/g)
        .map(item => parseInt(item));
        const discount = oldPrice - price;

        return {
            "id": id,
            "name": name,
            "isLiked": isLiked(),
            "tags": getTags(),
            "price": price,
            "oldPrice": oldPrice,
            "discount": discount,
            "discountPercent": getDiscountPercent(price, oldPrice),
            "currency": getCurrency(contentPriceContainer[0]),
            "properties": getProperties(),
            "description": getDescription(),
            "images": getImages(),
        }
    }

    /**
     * Функция для парсинга предложенных товаров
     * @returns array
     */
    function parseSuggested() {
        //получаем все карточки и перебираем их в цикле, чтобы сформировать массив объектов.
        const suggestedSection = document.querySelector('.suggested');
        const suggested = Array.from(suggestedSection.querySelector('.items').children)
        .map(suggestion => {
            const name = suggestion.querySelector('h3').textContent.trim();

            const description = suggestion.querySelector('p').textContent.trim();

            const image = suggestion.querySelector('img').getAttribute('src');

            const priceContainer = suggestion.querySelector('b');
            const contentPriceContainer = priceContainer.textContent.trim();
            //исключаем из строки все, кроме цифровых символов
            const price = contentPriceContainer.replace(/[^\d.]/g, '');

            return {
                "name": name,
                "description": description,
                "image": image,
                "price": price,
                "currency": getCurrency(contentPriceContainer[0]),
            }
        });

        return suggested;
    }

    /**
     * Функция для парсинга обзоров
     * @returns array
     */
    function parseReviews () {
        //получаем все карточки и перебираем их в цикле, чтобы сформировать массив обзоров.
        const reviewsSection = document.querySelector('.reviews');
        const reviews = Array.from(reviewsSection.querySelector('.items').children)
        .map(review => {

            function getAuthor(){
                const author = review.querySelector('.author');
                const name = author.querySelector('span').textContent.trim();
                const avatar = author.querySelector('img').getAttribute('src');
                return {
                    "avatar": avatar,
                    "name": name,
                }
            }

            //расчитываем рейтинг, перебирая массив со звездами и подсчитывая количество заполненных
            const ratingBox = Array.from(review.querySelector('.rating').children);
            let rating = 0;

            for(let point of ratingBox){
                if (point.classList.contains('filled')) {
                    rating++;
                }
            }

            const title = review.querySelector('.title').textContent.trim();

            const description = review.querySelector('.title + p').textContent.trim();

            const date = review.querySelector('i').textContent;

            return {
                "rating": rating,
                "author": getAuthor(),
                "title": title,
                "description": description,
                "date": reformatDateDD_MM_YYYY(date),
            }
        });

        return reviews;
    }

    return {
        meta: parseMeta(),
        product: parseProduct(),
        suggested: parseSuggested(),
        reviews: parseReviews(),
    };
}

window.parsePage = parsePage;