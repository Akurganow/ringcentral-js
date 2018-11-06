import Externals from '../core/Externals';

export interface ApiResponseOptions {
    externals: Externals;
    request: Request;
    response?: Response;
    responseText?: string;
}

export default class ApiResponse {
    static _contentType = 'Content-Type';
    static _jsonContentType = 'application/json';
    static _multipartContentType = 'multipart/mixed';
    static _urlencodedContentType = 'application/x-www-form-urlencoded';
    static _headerSeparator = ':';
    static _bodySeparator = '\n\n';
    static _boundarySeparator = '--';
    static _unauthorizedStatus = 401;
    static _rateLimitStatus = 429;

    private _externals: Externals;
    private _request: Request;
    private _response: Response;
    private _text: string;
    private _json: any = null;
    private _multipart: ApiResponse[] = [];

    constructor({externals, request, response = null, responseText = ''}: ApiResponseOptions) {
        this._externals = externals;
        this._request = request;
        this._response = response;
        this._text = responseText;
    }

    async receiveResponse(response: Response): Promise<string> {
        this._response = response;

        // Ignore if not known textual type
        this._text = !this._isMultipart() && !this._isJson() ? '' : await this.response().text();

        return this._text;
    }

    response() {
        return this._response;
    }

    request() {
        return this._request;
    }

    ok(): boolean {
        return this._response && this._response.ok;
    }

    text(): string {
        // Since we read text only in case JSON or Multipart
        if (!this._isJson() && !this._isMultipart()) throw new Error('Response is not text');
        return this._text;
    }

    json(): any {
        if (!this._isJson()) throw new Error('Response is not JSON');
        if (!this._json) {
            this._json = this._text ? JSON.parse(this._text) : null;
        }
        return this._json;
    }

    error(skipOKCheck = false): string {
        if (this.ok() && !skipOKCheck) return null;

        let msg =
            (this._response && this._response.status ? `${this._response.status} ` : '') +
            (this._response && this._response.statusText ? this._response.statusText : '');

        try {
            const {message, error_description, description} = this.json();

            if (message) msg = message;
            if (error_description) msg = error_description;
            if (description) msg = description;
        } catch (e) {} //eslint-disable-line

        return msg;
    }

    /**
     * If it is not known upfront what would be the response, client code can treat any response as multipart
     */
    toMultipart(): ApiResponse[] {
        return this._isMultipart() ? this.multipart() : [this];
    }

    multipart(): ApiResponse[] {
        if (!this._isMultipart()) throw new Error('Response is not multipart');

        if (!this._multipart.length) {
            // Step 1. Split multipart response

            const text = this.text();

            if (!text) throw new Error('No response body');

            let boundary;

            try {
                boundary = this._getContentType().match(/boundary=([^;]+)/i)[1]; //eslint-disable-line
            } catch (e) {
                throw new Error('Cannot find boundary');
            }

            if (!boundary) throw new Error('Cannot find boundary');

            const parts = text.toString().split(ApiResponse._boundarySeparator + boundary);

            if (parts[0].trim() === '') parts.shift();
            if (parts[parts.length - 1].trim() === ApiResponse._boundarySeparator) parts.pop();

            if (parts.length < 1) throw new Error('No parts in body');

            // Step 2. Parse status info

            const statusInfo = this._create(parts.shift(), this._response.status, this._response.statusText).json();

            // Step 3. Parse all other parts

            this._multipart = parts.map((part, i) => this._create(part, statusInfo.response[i].status));
        }

        return this._multipart;
    }

    private _isContentType(contentType) {
        return Boolean(~this._getContentType().indexOf(contentType));
    }

    private _getContentType() {
        return this._response.headers.get(ApiResponse._contentType) || '';
    }

    private _isMultipart() {
        return this._isContentType(ApiResponse._multipartContentType);
    }

    private _isJson() {
        return this._isContentType(ApiResponse._jsonContentType);
    }

    /**
     * Method is used to create ApiResponse object from string parts of multipart/mixed response
     */
    private _create(text = '', status = 200, statusText = 'OK'): ApiResponse {
        text = text.replace(/\r/g, '');

        const headers = new this._externals.Headers();
        const headersAndBody = text.split(ApiResponse._bodySeparator);
        const headersText = headersAndBody.length > 1 ? headersAndBody.shift() : '';

        text = headersAndBody.length > 0 ? headersAndBody.join(ApiResponse._bodySeparator) : null;

        (headersText || '').split('\n').forEach(header => {
            const split = header.trim().split(ApiResponse._headerSeparator);
            const key = split.shift().trim();
            const value = split.join(ApiResponse._headerSeparator).trim();

            if (key) headers.append(key, value);
        });

        const response = new this._externals.Response(text, {
            headers,
            status,
            statusText
        });

        return new ApiResponse({
            externals: this._externals,
            request: null,
            response,
            responseText: text
        });
    }
}
